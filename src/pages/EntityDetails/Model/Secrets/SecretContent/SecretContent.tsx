import {
  Button,
  CodeSnippet,
  Icon,
  Modal,
  Tooltip,
  ActionButton,
  Notification,
  usePortal,
} from "@canonical/react-components";
import { Form, Formik } from "formik";
import { useParams } from "react-router";

import type { EntityDetailsRoute } from "components/Routes";
import RevisionField from "components/secrets/RevisionField";
import SecretLabel from "components/secrets/SecretLabel";
import { useGetSecretContent } from "juju/api-hooks";
import { actions as jujuActions } from "store/juju";
import {
  getSecretByURI,
  getSecretsContent,
  getSecretsContentErrors,
  getSecretsContentLoaded,
  getSecretsContentLoading,
  getModelUUIDFromList,
  getModelByUUID,
  getSecretLatestRevision,
} from "store/juju/selectors";
import { useAppSelector, useAppDispatch } from "store/store";

import { Label } from "./types";

type Props = {
  secretURI: string;
};

const SecretContent = ({ secretURI }: Props) => {
  const { userName, modelName } = useParams<EntityDetailsRoute>();
  const dispatch = useAppDispatch();
  const modelUUID = useAppSelector(getModelUUIDFromList(modelName, userName));
  const wsControllerURL = useAppSelector((state) =>
    getModelByUUID(state, modelUUID),
  )?.wsControllerURL;
  const secret = useAppSelector((state) =>
    getSecretByURI(state, modelUUID, secretURI),
  );
  const latestRevision = useAppSelector((state) =>
    getSecretLatestRevision(state, modelUUID, secretURI),
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
                initialValues={{ revision: (latestRevision ?? "").toString() }}
                onSubmit={(values) => {
                  getSecretContent(secretURI, Number(values.revision));
                }}
              >
                <>
                  <h5>
                    Secret: <SecretLabel secret={secret} />
                  </h5>
                  <Form className="p-form--inline">
                    <RevisionField
                      secretURI={secretURI}
                      modelUUID={modelUUID}
                    />
                    <ActionButton
                      appearance="positive"
                      disabled={contentLoading}
                      loading={contentLoading}
                      type="submit"
                    >
                      {Label.SUBMIT}
                    </ActionButton>
                  </Form>
                </>
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
                      code: atob(value),
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
