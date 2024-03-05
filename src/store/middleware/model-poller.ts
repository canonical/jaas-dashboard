import type { Client } from "@canonical/jujulib";
import * as Sentry from "@sentry/browser";
import { isAction, type Middleware } from "redux";

import {
  disableControllerUUIDMasking,
  fetchAllModelStatuses,
  fetchControllerList,
  findAuditEvents,
  crossModelQuery,
  loginWithBakery,
  setModelSharingPermissions,
} from "juju/api";
import type { CrossModelQueryResponse } from "juju/jimm/JIMMV4";
import { JIMMRelation } from "juju/jimm/JIMMV4";
import type { ConnectionWithFacades } from "juju/types";
import { actions as appActions, thunks as appThunks } from "store/app";
import { actions as generalActions } from "store/general";
import { isLoggedIn } from "store/general/selectors";
import { actions as jujuActions } from "store/juju";
import type { RootState, Store } from "store/store";
import { isSpecificAction } from "types";
import { toErrorString } from "utils";

export enum AuditLogsError {
  CHECK_PERMISSIONS = "Unable to check Audit Logs user permission.",
}

export enum LoginError {
  LOG = "Unable to log into controller.",
  NO_INFO = "Unable to retrieve controller details.",
}

export enum ModelsError {
  LOAD_ALL_MODELS = "Unable to load models.",
  LOAD_SOME_MODELS = "Unable to load some models.",
  LOAD_LATEST_MODELS = "Unable to load latest model data.",
  LIST_OR_UPDATE_MODELS = "Unable to list or update models.",
}

const checkJIMMRelation = async (
  conn: ConnectionWithFacades,
  identity: string,
  relation: string,
) => {
  const response = await conn.facades.jimM?.checkRelation({
    object: identity,
    relation: relation,
    target_object: "controller-jimm",
  });
  return !!response?.allowed;
};

export const modelPollerMiddleware: Middleware<
  void,
  RootState,
  Store["dispatch"]
> = (reduxStore) => {
  const controllers = new Map<string, ConnectionWithFacades>();
  const jujus = new Map<string, Client>();
  return (next) => async (action) => {
    if (!isAction(action)) {
      return next(action);
    }
    if (
      isSpecificAction<ReturnType<typeof appActions.connectAndPollControllers>>(
        action,
        appActions.connectAndPollControllers.type,
      )
    ) {
      // Each time we try to log in to a controller we get new macaroons, so
      // first clean up any old auth requests:
      reduxStore.dispatch(generalActions.clearVisitURLs());
      for (const controllerData of action.payload.controllers) {
        const [wsControllerURL, credentials, identityProviderAvailable] =
          controllerData;
        let conn: ConnectionWithFacades | undefined;
        let juju: Client | undefined;
        let error: unknown;
        let intervalId: number | null | undefined;
        try {
          ({ conn, error, juju, intervalId } = await loginWithBakery(
            wsControllerURL,
            credentials,
            identityProviderAvailable,
          ));
          if (conn) {
            controllers.set(wsControllerURL, conn);
          }
          if (error) {
            reduxStore.dispatch(
              generalActions.storeLoginError({
                wsControllerURL,
                error: toErrorString(error),
              }),
            );
            return;
          }
        } catch (e) {
          reduxStore.dispatch(
            generalActions.storeLoginError({
              wsControllerURL,
              error:
                "Unable to log into the controller, check that the controller address is correct and that it is online.",
            }),
          );
          return console.log(LoginError.LOG, e, controllerData);
        }

        if (!conn?.info || !Object.keys(conn.info).length) {
          reduxStore.dispatch(
            generalActions.storeLoginError({
              wsControllerURL,
              error: LoginError.NO_INFO,
            }),
          );
          return;
        }

        // XXX Now that we can register multiple controllers this needs
        // to be sent per controller.
        if (
          process.env.NODE_ENV === "production" &&
          window.jujuDashboardConfig?.analyticsEnabled
        ) {
          Sentry.setTag("jujuVersion", conn.info.serverVersion);
        }

        // Remove the getFacade function as this doesn't need to be stored in Redux.
        delete conn.info.getFacade;
        // Store the controller info. The transport and facades are not used
        // (or available by other means) so no need to store them.
        reduxStore.dispatch(
          generalActions.updateControllerConnection({
            wsControllerURL,
            info: conn.info,
          }),
        );
        const jimmVersion = conn.facades.jimM?.version ?? 0;
        const auditLogsAvailable = jimmVersion >= 4;
        const identity = conn.info.user?.identity;
        let auditLogsAllowed = false;
        if (auditLogsAvailable && identity) {
          try {
            auditLogsAllowed = await checkJIMMRelation(
              conn,
              identity,
              JIMMRelation.AUDIT_LOG_VIEWER,
            );
            if (!auditLogsAllowed) {
              auditLogsAllowed = await checkJIMMRelation(
                conn,
                identity,
                JIMMRelation.ADMINISTRATOR,
              );
            }
            reduxStore.dispatch(jujuActions.updateAuditEventsErrors(null));
          } catch (error) {
            reduxStore.dispatch(
              jujuActions.updateAuditEventsErrors(
                AuditLogsError.CHECK_PERMISSIONS,
              ),
            );
            console.error(AuditLogsError.CHECK_PERMISSIONS, error);
          }
        }
        reduxStore.dispatch(
          generalActions.updateControllerFeatures({
            wsControllerURL,
            features: {
              crossModelQueries: jimmVersion >= 4,
              auditLogs: auditLogsAllowed && auditLogsAvailable,
            },
          }),
        );
        if (juju) {
          jujus.set(wsControllerURL, juju);
        }
        if (intervalId) {
          reduxStore.dispatch(
            generalActions.updatePingerIntervalId({
              wsControllerURL,
              intervalId,
            }),
          );
        }

        await fetchControllerList(
          wsControllerURL,
          conn,
          reduxStore.dispatch,
          reduxStore.getState,
        );
        if (identityProviderAvailable) {
          // This call will be a noop if the user isn't an administrator
          // on the JIMM controller we're connected to.
          try {
            await disableControllerUUIDMasking(conn);
          } catch (e) {
            // Silently fail, if this doesn't work then the user isn't authorized
            // to perform the action.
          }
        }

        let pollCount = 0;
        do {
          const identity = conn?.info?.user?.identity;
          if (identity) {
            try {
              const models = await conn.facades.modelManager?.listModels({
                tag: identity,
              });
              if (models) {
                reduxStore.dispatch(
                  jujuActions.updateModelList({ models, wsControllerURL }),
                );
              }
              const modelUUIDList =
                models?.["user-models"]?.map((item) => item.model.uuid) ?? [];
              await fetchAllModelStatuses(
                wsControllerURL,
                modelUUIDList,
                conn,
                reduxStore.dispatch,
                reduxStore.getState,
              );
              // If the code execution arrives here, then the model statuses
              // have been successfully updated. Models error should be removed.
              if (reduxStore.getState().juju.modelsError) {
                reduxStore.dispatch(
                  jujuActions.updateModelsError({
                    modelsError: null,
                    wsControllerURL,
                  }),
                );
              }
            } catch (error) {
              let errorMessage;
              if (
                error instanceof Error &&
                (error.message === ModelsError.LOAD_ALL_MODELS ||
                  error.message === ModelsError.LOAD_SOME_MODELS)
              ) {
                errorMessage = pollCount
                  ? ModelsError.LOAD_LATEST_MODELS
                  : error.message;
              } else {
                errorMessage = ModelsError.LIST_OR_UPDATE_MODELS;
              }
              console.error(errorMessage, error);
              reduxStore.dispatch(
                jujuActions.updateModelsError({
                  modelsError: errorMessage,
                  wsControllerURL,
                }),
              );
            }
          }

          // Allow the polling to run a certain number of times in tests.
          if (process.env.NODE_ENV === "test") {
            if (pollCount === action.payload.poll) {
              break;
            }
          }
          pollCount++;
          // Wait 30s then start again.
          await new Promise((resolve) => {
            setTimeout(() => {
              resolve(true);
            }, 30000);
          });
        } while (isLoggedIn(reduxStore.getState(), wsControllerURL));
      }
      return;
    } else if (action.type === appThunks.logOut.pending.type) {
      jujus.forEach((juju) => {
        juju.logout();
      });
      return next(action);
    } else if (
      isSpecificAction<ReturnType<typeof appActions.updatePermissions>>(
        action,
        appActions.updatePermissions.type,
      )
    ) {
      const { payload } = action;
      const conn = controllers.get(payload.wsControllerURL);
      const response = await setModelSharingPermissions(
        payload.wsControllerURL,
        payload.modelUUID,
        conn,
        payload.user,
        payload.permissionTo,
        payload.permissionFrom,
        payload.action,
        reduxStore.dispatch,
      );
      return response;
    } else if (
      isSpecificAction<ReturnType<typeof jujuActions.fetchAuditEvents>>(
        action,
        jujuActions.fetchAuditEvents.type,
      )
    ) {
      // Intercept fetchAuditEvents actions and fetch and store audit events via the
      // controller connection.

      const { wsControllerURL, ...params } = action.payload;
      // Immediately pass the action along so that it can be handled by the
      // reducer to update the loading state.
      next(action);
      const conn = controllers.get(wsControllerURL);
      if (!conn) {
        return;
      }
      const auditEvents = await findAuditEvents(conn, params);
      reduxStore.dispatch(jujuActions.updateAuditEvents(auditEvents.events));
      // The action has already been passed to the next middleware at the top of
      // this handler.
      return;
    } else if (
      isSpecificAction<ReturnType<typeof jujuActions.fetchCrossModelQuery>>(
        action,
        jujuActions.fetchCrossModelQuery.type,
      )
    ) {
      // Intercept fetchCrossModelQuery actions and fetch and store
      // cross model query via the controller connection.

      const { wsControllerURL, query } = action.payload;
      // Immediately pass the action along so that it can be handled by the
      // reducer to update the loading state.
      next(action);
      const conn = controllers.get(wsControllerURL);
      if (!conn) {
        return;
      }
      let crossModelQueryResponse: CrossModelQueryResponse | Error;
      try {
        crossModelQueryResponse = await crossModelQuery(conn, query);
      } catch (error) {
        console.error("Could not perform cross model query:", error);
        crossModelQueryResponse =
          error instanceof Error
            ? error
            : new Error("Unable to perform search. Please try again later.");
      }
      reduxStore.dispatch(
        jujuActions.updateCrossModelQuery(crossModelQueryResponse),
      );
      // The action has already been passed to the next middleware
      // at the top of this handler.
      return;
    }
    return next(action);
  };
};
