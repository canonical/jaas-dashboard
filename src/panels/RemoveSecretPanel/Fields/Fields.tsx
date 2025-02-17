import {
  ConfirmationModal,
  FormikField,
  usePortal,
} from "@canonical/react-components";
import { useFormikContext } from "formik";
import type { JSX } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

import type { EntityDetailsRoute } from "components/Routes";
import RevisionField from "components/secrets/RevisionField";
import {
  getSecretByURI,
  getModelUUIDFromList,
  getSecretLatestRevision,
} from "store/juju/selectors";
import { useAppSelector } from "store/store";

import type { FormFields } from "../types";

import { Label } from "./types";

type Props = {
  hideConfirm: () => void;
  handleRemoveSecret: (values: FormFields) => void;
  secretURI?: string | null;
  showConfirm: boolean;
};

const Fields = ({
  hideConfirm,
  handleRemoveSecret,
  secretURI,
  showConfirm,
}: Props): JSX.Element => {
  const { userName, modelName } = useParams<EntityDetailsRoute>();
  const modelUUID = useSelector(getModelUUIDFromList(modelName, userName));
  const { values } = useFormikContext<FormFields>();
  const secret = useAppSelector((state) =>
    getSecretByURI(state, modelUUID, secretURI),
  );
  const latestRevision = useAppSelector((state) =>
    getSecretLatestRevision(state, modelUUID, secretURI),
  );
  const { Portal } = usePortal();

  return (
    <>
      {(secret?.revisions.length ?? 0) > 1 && secretURI ? (
        <>
          <FormikField
            id={Label.REMOVE_ALL}
            label={Label.REMOVE_ALL}
            name="removeAll"
            type="checkbox"
            disabled={secret?.revisions.length === 1}
          />
          <RevisionField
            disabled={values.removeAll}
            secretURI={secretURI}
            modelUUID={modelUUID}
          />
        </>
      ) : (
        <p>
          This secret has one revision{" "}
          {latestRevision ? ` (${latestRevision})` : ""} and will be completely
          removed.
        </p>
      )}
      {showConfirm ? (
        <Portal>
          <ConfirmationModal
            title={Label.CONFIRM_TITLE}
            cancelButtonLabel={Label.CANCEL_BUTTON}
            confirmButtonLabel={Label.CONFIRM_BUTTON}
            confirmButtonAppearance="negative"
            confirmExtra={
              <p className="u-text--muted p-text--small u-align--left">
                This action can't be undone.
              </p>
            }
            onConfirm={() => {
              handleRemoveSecret(values);
            }}
            close={hideConfirm}
          >
            <p>Are you sure you would like to remove this secret?</p>
          </ConfirmationModal>
        </Portal>
      ) : null}
    </>
  );
};

export default Fields;
