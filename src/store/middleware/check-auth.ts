/*
  Redux middleware that gates every request on authentication unless an action
  has been allowed.
*/

import { isAction, type Middleware } from "redux";

import * as jimmListeners from "juju/jimm/listeners";
import * as jimmThunks from "juju/jimm/thunks";
import { actions as appActions, thunks as appThunks } from "store/app";
import { actions as generalActions } from "store/general";
import { isLoggedIn } from "store/general/selectors";
import { actions as jujuActions } from "store/juju";
import { addControllerCloudRegion } from "store/juju/thunks";
import type { RootState, Store } from "store/store";
import { isPayloadAction } from "types";
import { logger } from "utils/logger";

function error(name: string, wsControllerURL?: string | null) {
  // Not shown in UI. Logged for debugging purposes.
  logger.error(
    "Unable to perform action: ",
    name,
    wsControllerURL
      ? `. User not authenticated for the controller: ${wsControllerURL}. ` +
          "Did the user log out before this was dispatched?"
      : ". Either 'wsControllerURL' needs to be added to the dispatched " +
          "action or add the action to the list of actions allowed to be " +
          "performed while logged out.",
  );
}

export const checkLoggedIn = (state: RootState, wsControllerURL: string) => {
  if (!wsControllerURL) {
    // Not shown in UI. Logged for debugging purposes.
    logger.error(
      "Unable to determine logged in status. " +
        "'wsControllerURL' was not provided in the action that was dispatched.",
    );
  }
  return isLoggedIn(state, wsControllerURL);
};

/**
  Redux middleware to enable gating actions on the respective controller
  authentication.
  @param action The typical Redux action or thunk to execute
  @param options Any options that this checker needs to perform an
    appropriate auth check.
      wsControllerURL: The full controller websocket url that the controller
        is stored under in redux in order to determine it's logged in status.
*/
export const checkAuthMiddleware: Middleware<
  void,
  RootState,
  Store["dispatch"]
> =
  ({ getState }) =>
  (next) =>
  async (action) => {
    // These lists need to be generated at run time to prevent circular imports.
    const actionAllowlist = [
      appActions.connectAndPollControllers.type,
      generalActions.cleanupLoginErrors.type,
      generalActions.clearVisitURLs.type,
      generalActions.logOut.type,
      generalActions.removeVisitURL.type,
      generalActions.storeConfig.type,
      generalActions.storeLoginError.type,
      generalActions.storeConnectionError.type,
      generalActions.storeUserPass.type,
      generalActions.storeVersion.type,
      generalActions.storeVisitURL.type,
      generalActions.updateControllerConnection.type,
      generalActions.updatePingerIntervalId.type,
      generalActions.updateLoginLoading.type,
      jimmListeners.pollWhoamiStart.type,
      jimmListeners.pollWhoamiStop.type,
      jujuActions.populateMissingAllWatcherData.type,
      jujuActions.processAllWatcherDeltas.type,
      jujuActions.updateAuditEvents.type,
      jujuActions.updateAuditEventsLimit.type,
      jujuActions.updateAuditEventsErrors.type,
      jujuActions.updateControllerList.type,
      jujuActions.clearControllerData.type,
      jujuActions.clearModelData.type,
      jujuActions.clearAuditEvents.type,
      jujuActions.updateCrossModelQueryResults.type,
      jujuActions.updateCrossModelQueryErrors.type,
      jujuActions.updateControllerList.type,
      jujuActions.addCheckRelationErrors.type,
      jujuActions.addCheckRelation.type,
      jujuActions.checkRelation.type,
      jujuActions.removeCheckRelation.type,
      jujuActions.clearControllerData.type,
      jujuActions.clearModelData.type,
      jujuActions.clearCrossModelQuery.type,
      jujuActions.updateSelectedApplications.type,
    ];

    const thunkAllowlist = [
      appThunks.connectAndStartPolling.fulfilled.type,
      appThunks.connectAndStartPolling.pending.type,
      appThunks.connectAndStartPolling.rejected.type,
      appThunks.logOut.fulfilled.type,
      appThunks.logOut.pending.type,
      appThunks.logOut.rejected.type,
      addControllerCloudRegion.fulfilled.type,
      addControllerCloudRegion.pending.type,
      addControllerCloudRegion.rejected.type,
      jimmThunks.logout.fulfilled.type,
      jimmThunks.logout.pending.type,
      jimmThunks.logout.rejected.type,
      jimmThunks.whoami.fulfilled.type,
      jimmThunks.whoami.pending.type,
      jimmThunks.whoami.rejected.type,
    ];

    const state = getState();

    // If the action is a function then it's probably a thunk.
    if (typeof action === "function") {
      // Authentication checks are done by the thunks.
      return await next(action);
    } else if (isAction(action)) {
      const wsControllerURL =
        isPayloadAction(action) &&
        "wsControllerURL" in action.payload &&
        typeof action.payload.wsControllerURL === "string"
          ? action.payload.wsControllerURL
          : null;
      if (
        actionAllowlist.includes(action.type) ||
        thunkAllowlist.includes(action.type) ||
        (wsControllerURL && checkLoggedIn(state, wsControllerURL))
      ) {
        return next(action);
      } else {
        error(action.type, wsControllerURL);
      }
    }
  };

export default checkAuthMiddleware;
