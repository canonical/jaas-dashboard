/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from "@canonical/react-components";
import type { JSX } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import LoadingHandler from "components/LoadingHandler";
import Panel from "components/Panel";
import RadioInputBox from "components/RadioInputBox";
import ActionOptions from "panels/ActionsPanel/ActionOptions";
import type {
  ActionOptionValue,
  ActionOptionValues,
} from "panels/ActionsPanel/types";
import { enableSubmit, onValuesChange } from "panels/ActionsPanel/utils";
import { CharmsAndActionsPanelTestId } from "panels/CharmsAndActionsPanel";
import CharmActionsPanelTitle from "panels/CharmsAndActionsPanel/CharmActionsPanelTitle";
import { ConfirmType, type ConfirmTypes } from "panels/types";
import {
  getSelectedApplications,
  getSelectedCharm,
} from "store/juju/selectors";

import ConfirmationDialog from "./ConfirmationDialog";

const filterExist = <I,>(item: I | null): item is I => !!item;

export type Props = {
  charmURL: string;
  onRemovePanelQueryParams: () => void;
};

export default function CharmActionsPanel({
  charmURL,
  onRemovePanelQueryParams,
}: Props): JSX.Element {
  const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
  const [confirmType, setConfirmType] = useState<ConfirmTypes>(null);
  const [selectedAction, setSelectedAction] = useState<string>();
  const actionOptionsValues = useRef<ActionOptionValues>({});

  const selectedApplications = useSelector(getSelectedApplications(charmURL));
  const selectedCharm = useSelector(getSelectedCharm(charmURL));
  const actionData = useMemo(
    () => selectedCharm?.actions?.specs || {},
    [selectedCharm],
  );
  const unitCount = selectedApplications.reduce(
    (total, app) => total + (app["unit-count"] || 0),
    0,
  );

  const handleSubmit = () => {
    setConfirmType(ConfirmType.SUBMIT);
  };

  const changeHandler = useCallback(
    (actionName: string, values: ActionOptionValue) => {
      onValuesChange(actionName, values, actionOptionsValues);
      enableSubmit(
        selectedAction,
        selectedApplications
          .map((a) => ("name" in a ? a.name : null))
          .filter(filterExist),
        actionData,
        actionOptionsValues,
        setDisableSubmit,
      );
    },
    [selectedAction],
  );

  const selectHandler = useCallback(
    (actionName: string) => {
      setSelectedAction(actionName);
      enableSubmit(
        actionName,
        selectedApplications
          .map((a) => ("name" in a ? a.name : null))
          .filter(filterExist),
        actionData,
        actionOptionsValues,
        setDisableSubmit,
      );
    },
    [actionData],
  );

  return (
    <Panel
      drawer={
        <Button
          appearance="positive"
          disabled={disableSubmit || unitCount === 0}
          onClick={handleSubmit}
        >
          Run action
        </Button>
      }
      width="narrow"
      data-testid={CharmsAndActionsPanelTestId.PANEL}
      title={<CharmActionsPanelTitle charmURL={charmURL} />}
      onRemovePanelQueryParams={onRemovePanelQueryParams}
      animateMount={false}
    >
      <LoadingHandler
        hasData={Object.keys(actionData).length > 0}
        loading={false}
        noDataMessage="This charm has not provided any actions."
      >
        {Object.keys(actionData).map((actionName) => (
          <RadioInputBox
            name={actionName}
            description={actionData[actionName].description}
            onSelect={selectHandler}
            selectedInput={selectedAction}
            key={actionName}
          >
            <ActionOptions
              name={actionName}
              data={actionData}
              onValuesChange={changeHandler}
            />
          </RadioInputBox>
        ))}
        {selectedAction ? (
          <ConfirmationDialog
            confirmType={confirmType}
            selectedAction={selectedAction}
            selectedApplications={selectedApplications}
            setConfirmType={setConfirmType}
            selectedActionOptionValue={
              actionOptionsValues.current[selectedAction]
            }
            onRemovePanelQueryParams={onRemovePanelQueryParams}
          />
        ) : null}
      </LoadingHandler>
    </Panel>
  );
}
