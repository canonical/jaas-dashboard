import { ConfirmationModal, usePortal } from "@canonical/react-components";
import { useParams } from "react-router";

import type { EntityDetailsRoute } from "components/Routes";
import { type SetError } from "hooks/useInlineErrors";
import { useExecuteActionOnUnits } from "juju/api-hooks";
import type { ConfirmTypes } from "panels/types";
import { ConfirmType } from "panels/types";
import { logger } from "utils/logger";

import { InlineErrors, type ActionOptionValue } from "../types";

import { Label } from "./types";

type Props = {
  confirmType: ConfirmType;
  selectedAction: string;
  selectedUnits: string[];
  setConfirmType: React.Dispatch<React.SetStateAction<ConfirmTypes>>;
  setIsExecutingAction: React.Dispatch<React.SetStateAction<boolean>>;
  selectedActionOptionValue: ActionOptionValue;
  handleRemovePanelQueryParams: () => void;
  setInlineErrors: SetError;
};

const ConfirmationDialog = ({
  confirmType,
  selectedAction,
  selectedUnits,
  setConfirmType,
  setIsExecutingAction,
  selectedActionOptionValue,
  handleRemovePanelQueryParams,
  setInlineErrors,
}: Props): JSX.Element | null => {
  const { Portal } = usePortal();
  const { modelName, userName } = useParams<EntityDetailsRoute>();
  const executeActionOnUnits = useExecuteActionOnUnits(userName, modelName);

  if (confirmType === ConfirmType.SUBMIT) {
    const unitNames = selectedUnits.reduce((acc, unitName) => {
      return `${acc}, ${unitName.split("/")[1]}`;
    });
    // Render the submit confirmation modal.
    return (
      <Portal>
        <ConfirmationModal
          title={`Run ${selectedAction}?`}
          cancelButtonLabel={Label.CANCEL_BUTTON}
          confirmButtonLabel={Label.CONFIRM_BUTTON}
          confirmButtonAppearance="positive"
          onConfirm={() => {
            setConfirmType(null);
            setIsExecutingAction(true);
            executeActionOnUnits(
              selectedUnits,
              selectedAction,
              selectedActionOptionValue,
            )
              .then(() => {
                handleRemovePanelQueryParams();
                return;
              })
              .catch((error) => {
                setInlineErrors(
                  InlineErrors.EXECUTE_ACTION,
                  Label.EXECUTE_ACTION_ERROR,
                );
                setIsExecutingAction(false);
                logger.error(Label.EXECUTE_ACTION_ERROR, error);
              });
          }}
          close={() => setConfirmType(null)}
        >
          <h4 className="p-muted-heading u-no-margin--bottom">UNIT COUNT</h4>
          <p data-testid="confirmation-modal-unit-count">
            {selectedUnits.length}
          </p>
          <h4 className="p-muted-heading u-no-margin--bottom u-no-padding--top">
            UNIT NAME
          </h4>
          <p data-testid="confirmation-modal-unit-names">{unitNames}</p>
        </ConfirmationModal>
      </Portal>
    );
  }
  return null;
};

export default ConfirmationDialog;
