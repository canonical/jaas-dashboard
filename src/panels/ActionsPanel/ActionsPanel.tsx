import { ActionButton, Button } from "@canonical/react-components";
import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

import CharmIcon from "components/CharmIcon";
import LoadingHandler from "components/LoadingHandler";
import Panel from "components/Panel";
import RadioInputBox from "components/RadioInputBox";
import type { EntityDetailsRoute } from "components/Routes";
import useInlineErrors from "hooks/useInlineErrors";
import { useGetActionsForApplication } from "juju/api-hooks";
import PanelInlineErrors from "panels/PanelInlineErrors";
import { usePanelQueryParams } from "panels/hooks";
import { ConfirmType, type ConfirmTypes } from "panels/types";
import { getModelUUID } from "store/juju/selectors";
import { pluralize } from "store/juju/utils/models";
import type { RootState } from "store/store";
import { useAppStore } from "store/store";
import { logger } from "utils/logger";

import ActionOptions from "./ActionOptions";
import ConfirmationDialog from "./ConfirmationDialog";
import type {
  ActionData,
  ActionOptionValue,
  ActionOptionValues,
} from "./types";
import { InlineErrors, Label, TestId } from "./types";
import { enableSubmit, onValuesChange } from "./utils";

type SetSelectedAction = (actionName: string) => void;

type ActionsQueryParams = {
  panel?: string | null;
  units?: string[];
};

export default function ActionsPanel(): JSX.Element {
  const appStore = useAppStore();
  const appState = appStore.getState();
  const { appName, modelName, userName } = useParams<EntityDetailsRoute>();
  const getModelUUIDMemo = useMemo(
    () => (modelName ? getModelUUID(modelName) : null),
    [modelName],
  );
  const modelUUID = useSelector((state: RootState) =>
    getModelUUIDMemo?.(state),
  );
  const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
  const [actionData, setActionData] = useState<ActionData>({});
  const [fetchingActionData, setFetchingActionData] = useState(false);
  const [confirmType, setConfirmType] = useState<ConfirmTypes>(null);
  const getActionsForApplication = useGetActionsForApplication(
    userName,
    modelName,
  );
  const [selectedAction, setSelectedAction]: [
    string | undefined,
    SetSelectedAction,
  ] = useState<string>();
  const [inlineErrors, setInlineErrors, hasInlineError] = useInlineErrors({
    [InlineErrors.GET_ACTION]: (error) => (
      // If get actions for application fails, we add a button for
      // refetching the actions data to the first inline error.
      <>
        {error} Try{" "}
        <Button
          appearance="link"
          onClick={() => getActionsForApplicationCallback()}
        >
          refetching
        </Button>{" "}
        the actions data.
      </>
    ),
  });
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);
  const scrollArea = useRef<HTMLDivElement>(null);

  const actionOptionsValues = useRef<ActionOptionValues>({});

  const defaultQueryParams: ActionsQueryParams = { panel: null, units: [] };
  const [queryParams, , handleRemovePanelQueryParams] =
    usePanelQueryParams<ActionsQueryParams>(defaultQueryParams);
  const selectedUnits = useMemo(
    () => queryParams.units ?? [],
    [queryParams.units],
  );

  const getActionsForApplicationCallback = useCallback(() => {
    setFetchingActionData(true);
    if (appName && modelUUID) {
      getActionsForApplication(appName)
        .then((actions) => {
          if (actions?.results?.[0]?.actions) {
            setActionData(actions.results[0].actions);
          }
          setInlineErrors(InlineErrors.GET_ACTION, null);
          return;
        })
        .catch((error) => {
          setInlineErrors(InlineErrors.GET_ACTION, Label.GET_ACTIONS_ERROR);
          logger.error(Label.GET_ACTIONS_ERROR, error);
        })
        .finally(() => {
          setFetchingActionData(false);
        });
    }
  }, [appName, getActionsForApplication, modelUUID, setInlineErrors]);

  useEffect(() => {
    getActionsForApplicationCallback();
  }, [getActionsForApplicationCallback]);

  const namespace =
    appName && modelUUID
      ? appState.juju?.modelData?.[modelUUID]?.applications?.[appName]?.charm
      : null;

  const generateSelectedUnitList = useCallback(() => {
    if (!selectedUnits.length) {
      return Label.NO_UNITS_SELECTED;
    }
    return selectedUnits.reduce((acc, unitName) => {
      return `${acc}, ${unitName.split("/")[1]}`;
    });
  }, [selectedUnits]);

  const generateTitle = () => {
    const unitLength = selectedUnits.length;
    return (
      <>
        {appName && namespace ? (
          <CharmIcon name={appName} charmId={namespace} />
        ) : null}{" "}
        {unitLength} {pluralize(unitLength, "unit")} selected
      </>
    );
  };

  const handleSubmit = () => {
    setConfirmType(ConfirmType.SUBMIT);
  };

  const changeHandler = useCallback(
    (actionName: string, values: ActionOptionValue) => {
      onValuesChange(actionName, values, actionOptionsValues);
      enableSubmit(
        selectedAction,
        selectedUnits,
        actionData,
        actionOptionsValues,
        setDisableSubmit,
      );
    },
    [actionData, selectedAction, selectedUnits],
  );

  const selectHandler = useCallback(
    (actionName: string) => {
      setSelectedAction(actionName);
      enableSubmit(
        actionName,
        selectedUnits,
        actionData,
        actionOptionsValues,
        setDisableSubmit,
      );
    },
    [actionData, selectedUnits],
  );

  const data = Object.keys(actionData).length > 0 ? actionData : null;

  return (
    <Panel
      drawer={
        <ActionButton
          appearance="positive"
          loading={isExecutingAction}
          disabled={disableSubmit || isExecutingAction}
          onClick={handleSubmit}
        >
          Run action
        </ActionButton>
      }
      width="narrow"
      data-testid={TestId.PANEL}
      title={generateTitle()}
      onRemovePanelQueryParams={handleRemovePanelQueryParams}
      ref={scrollArea}
    >
      <PanelInlineErrors
        inlineErrors={inlineErrors}
        scrollArea={scrollArea.current}
      />
      <p data-testid="actions-panel-unit-list">
        Run action on: {generateSelectedUnitList()}
      </p>
      <LoadingHandler
        hasData={!!data}
        loading={fetchingActionData}
        noDataMessage={
          hasInlineError(InlineErrors.GET_ACTION)
            ? ""
            : Label.NO_ACTIONS_PROVIDED
        }
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
      </LoadingHandler>
      {selectedAction && confirmType ? (
        <ConfirmationDialog
          confirmType={confirmType}
          selectedAction={selectedAction}
          selectedUnits={selectedUnits}
          setConfirmType={setConfirmType}
          setIsExecutingAction={setIsExecutingAction}
          selectedActionOptionValue={
            actionOptionsValues.current[selectedAction]
          }
          handleRemovePanelQueryParams={handleRemovePanelQueryParams}
          setInlineErrors={setInlineErrors}
        />
      ) : null}
    </Panel>
  );
}
