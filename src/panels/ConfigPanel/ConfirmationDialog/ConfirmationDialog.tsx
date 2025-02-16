import { ConfirmationModal, usePortal } from "@canonical/react-components";
import type { JSX } from "react";
import { useParams } from "react-router";

import type { EntityDetailsRoute } from "components/Routes";
import SecretLabel from "components/secrets/SecretLabel";
import useAnalytics from "hooks/useAnalytics";
import useCanManageSecrets from "hooks/useCanManageSecrets";
import { type SetError } from "hooks/useInlineErrors";
import { useGrantSecret, useSetApplicationConfig } from "juju/api-hooks";
import type { usePanelQueryParams } from "panels/hooks";
import { ConfirmType as DefaultConfirmType } from "panels/types";
import { getModelSecrets } from "store/juju/selectors";
import { useAppSelector } from "store/store";
import { logger } from "utils/logger";

import ChangedKeyValues from "../ChangedKeyValues";
import type { Config, ConfigQueryParams, ConfirmTypes } from "../types";
import { ConfigConfirmType } from "../types";
import { getRequiredGrants } from "../utils";

import { InlineErrors, Label } from "./types";

type Props = {
  confirmType: ConfirmTypes;
  queryParams: ConfigQueryParams;
  setEnableSave: React.Dispatch<React.SetStateAction<boolean>>;
  setSavingConfig: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmType: React.Dispatch<React.SetStateAction<ConfirmTypes>>;
  setInlineError: SetError;
  config: Config;
  handleRemovePanelQueryParams: ReturnType<typeof usePanelQueryParams>[2];
};

const ConfirmationDialog = ({
  confirmType,
  queryParams,
  setEnableSave,
  setSavingConfig,
  setConfirmType,
  setInlineError,
  config,
  handleRemovePanelQueryParams,
}: Props): JSX.Element | null => {
  const { Portal } = usePortal();
  const { userName, modelName } = useParams<EntityDetailsRoute>();
  const { entity: appName, modelUUID } = queryParams;
  const grantSecret = useGrantSecret(userName, modelName);
  const setApplicationConfig = useSetApplicationConfig(userName, modelName);
  const canManageSecrets = useCanManageSecrets();
  const sendAnalytics = useAnalytics();
  const secrets = useAppSelector((state) => getModelSecrets(state, modelUUID));

  async function _submitToJuju(appName: string) {
    setSavingConfig(true);
    const response = await setApplicationConfig(appName, config);
    const errors = response?.results?.reduce<string[]>((collection, result) => {
      if (result.error) {
        collection.push(result.error.message);
      }
      return collection;
    }, []);
    setSavingConfig(false);
    setEnableSave(false);
    setConfirmType(null);
    if (errors?.length) {
      setInlineError(InlineErrors.FORM, errors);
      return;
    }
    sendAnalytics({
      category: "User",
      action: "Config values updated",
    });
    if (
      canManageSecrets &&
      getRequiredGrants(appName, config, secrets)?.length
    ) {
      setConfirmType(ConfigConfirmType.GRANT);
    } else {
      handleRemovePanelQueryParams();
    }
  }
  if (!appName) {
    return null;
  } else if (confirmType === DefaultConfirmType.SUBMIT) {
    // Render the submit confirmation modal.
    return (
      <Portal>
        <ConfirmationModal
          // Prevent clicks inside this panel from closing the parent panel.
          // This is handled in `checkCanClose`.
          className="prevent-panel-close"
          title={Label.SAVE_CONFIRM}
          confirmExtra={
            <p className="u-text--muted p-text--small u-align--left">
              You can revert back to the applications default settings by
              clicking the “Reset all values” button; or reset each edited field
              by clicking “Use default”.
            </p>
          }
          cancelButtonLabel={Label.SAVE_CONFIRM_CANCEL_BUTTON}
          confirmButtonLabel={Label.SAVE_CONFIRM_CONFIRM_BUTTON}
          confirmButtonAppearance="positive"
          onConfirm={() => {
            setConfirmType(null);
            // Clear the form errors if there were any from a previous submit.
            setInlineError(InlineErrors.FORM, null);
            _submitToJuju(appName).catch((error) => {
              setInlineError(
                InlineErrors.SUBMIT_TO_JUJU,
                Label.SUBMIT_TO_JUJU_ERROR,
              );
              logger.error(Label.SUBMIT_TO_JUJU_ERROR, error);
            });
          }}
          close={() => setConfirmType(null)}
        >
          <ChangedKeyValues appName={appName} config={config} />
        </ConfirmationModal>
      </Portal>
    );
  } else if (confirmType === ConfigConfirmType.GRANT) {
    // Render the grant confirmation modal.
    const requiredGrants = getRequiredGrants(appName, config, secrets);
    return (
      <Portal>
        <ConfirmationModal
          // Prevent clicks inside this panel from closing the parent panel.
          // This is handled in `checkCanClose`.
          className="prevent-panel-close"
          title={Label.GRANT_CONFIRM}
          cancelButtonLabel={Label.GRANT_CANCEL_BUTTON}
          confirmButtonLabel={Label.GRANT_CONFIRM_BUTTON}
          confirmButtonAppearance="positive"
          onConfirm={() => {
            setConfirmType(null);
            // Clear the form errors if there were any from a previous submit.
            setInlineError(InlineErrors.FORM, null);
            if (!requiredGrants) {
              // It is not possible to get to this point if these
              // variables aren't set.
              return;
            }
            void (async () => {
              try {
                for (const secretURI of requiredGrants) {
                  await grantSecret(secretURI, [appName]);
                }
                setConfirmType(null);
                handleRemovePanelQueryParams();
              } catch (error) {
                setInlineError(InlineErrors.SUBMIT_TO_JUJU, Label.GRANT_ERROR);
                logger.error(Label.GRANT_ERROR, error);
              }
            })();
          }}
          close={() => {
            setConfirmType(null);
            handleRemovePanelQueryParams();
          }}
        >
          <p>
            Would you like to grant access to this application for the following
            secrets?
          </p>
          <ul>
            {requiredGrants?.map((secretURI) => {
              const secret = secrets?.find(({ uri }) => uri === secretURI);
              return (
                <li key={secretURI}>
                  {secret ? <SecretLabel secret={secret} /> : secretURI}
                </li>
              );
            })}
          </ul>
        </ConfirmationModal>
      </Portal>
    );
  } else if (confirmType === DefaultConfirmType.CANCEL) {
    // Render the cancel confirmation modal.
    return (
      <Portal>
        <ConfirmationModal
          className="prevent-panel-close"
          title={Label.CANCEL_CONFIRM}
          cancelButtonLabel={Label.CANCEL_CONFIRM_CANCEL_BUTTON}
          confirmButtonLabel={Label.CANCEL_CONFIRM_CONFIRM_BUTTON}
          onConfirm={() => {
            setConfirmType(null);
            handleRemovePanelQueryParams();
          }}
          close={() => setConfirmType(null)}
        >
          <ChangedKeyValues appName={appName} config={config} />
        </ConfirmationModal>
      </Portal>
    );
  }
  return null;
};

export default ConfirmationDialog;
