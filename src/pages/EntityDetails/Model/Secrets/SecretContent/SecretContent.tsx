import {
  Button,
  CodeSnippet,
  Icon,
  Modal,
  Tooltip,
  ActionButton,
  Notification,
} from "@canonical/react-components";
import { Form, Formik } from "formik";
import { useParams } from "react-router-dom";
import usePortal from "react-useportal";

import type { EntityDetailsRoute } from "components/Routes/Routes";
import RevisionField from "components/secrets/RevisionField";
import { useGetSecretContent } from "juju/apiHooks";
import { actions as jujuActions } from "store/juju";
import {
  getSecretByURI,
  getSecretsContent,
  getSecretsContentErrors,
  getSecretsContentLoaded,
  getSecretsContentLoading,
  getModelUUIDFromList,
  getModelByUUID,
} from "store/juju/selectors";
import { useAppSelector, useAppDispatch } from "store/store";

export enum Label {
  MODAL_TITLE = "Secret values",
  SHOW = "Show content",
  SUBMIT = "View",
}

type Props = {
  label?: string;
  secretURI: string;
};

const SecretContent = ({ label, secretURI }: Props) => {
  const { userName, modelName } = useParams<EntityDetailsRoute>();
  const dispatch = useAppDispatch();
  const modelUUID = useAppSelector(getModelUUIDFromList(modelName, userName));
  const wsControllerURL = useAppSelector((state) =>
    getModelByUUID(state, modelUUID),
  )?.wsControllerURL;
  const secret = useAppSelector((state) =>
    getSecretByURI(state, modelUUID, secretURI),
  );
  const content = useAppSelector((state) =>
    getSecretsContent(state, modelUUID),
  );
  const contentError = useAppSelector((state) =>
    getSecretsContentErrors(state, modelUUID),
  );
  const contentLoaded = useAppSelector((state) =>
    getSecretsContentLoaded(state, modelUUID),
  );
  const contentLoading = useAppSelector((state) =>
    getSecretsContentLoading(state, modelUUID),
  );
  const { openPortal, closePortal, isOpen, Portal } = usePortal();
  const getSecretContent = useGetSecretContent(userName, modelName);

  return (
    <>
      <Tooltip message="View secret values">
        <Button
          appearance="base"
          className="is-small"
          onClick={openPortal}
          type="button"
          hasIcon
        >
          <Icon name="show">{Label.SHOW}</Icon>
          {label ? <span>{label}</span> : null}
        </Button>
      </Tooltip>
      {isOpen && (
        <Portal>
          <Modal
            className="info-panel__modal"
            close={() => {
              closePortal();
              if (wsControllerURL) {
                dispatch(
                  jujuActions.clearSecretsContent({
                    modelUUID,
                    wsControllerURL,
                  }),
                );
              }
            }}
            title={Label.MODAL_TITLE}
          >
            {secret ? (
              <Formik<{ revision: string }>
                initialValues={{
                  revision: secret["latest-revision"].toString(),
                }}
                onSubmit={(values) => {
                  getSecretContent(secretURI, Number(values.revision));
                }}
              >
                <Form className="p-form--inline">
                  <RevisionField secretURI={secretURI} modelUUID={modelUUID} />
                  <ActionButton
                    appearance="positive"
                    disabled={contentLoading}
                    loading={contentLoading}
                    type="submit"
                  >
                    {Label.SUBMIT}
                  </ActionButton>
                </Form>
              </Formik>
            ) : null}
            {contentLoaded && !contentLoading ? (
              <>
                <hr />
                {contentError ? (
                  <Notification severity="negative" title="Error:">
                    {contentError}
                  </Notification>
                ) : null}
                <CodeSnippet
                  blocks={Object.entries(content ?? {})?.map(
                    ([key, value]) => ({
                      title: key,
                      code: value,
                    }),
                  )}
                />
              </>
            ) : null}
          </Modal>
        </Portal>
      )}
    </>
  );
};

export default SecretContent;
