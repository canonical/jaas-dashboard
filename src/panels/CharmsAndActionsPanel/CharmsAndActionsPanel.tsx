import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import Panel from "components/Panel";
import type { EntityDetailsRoute } from "components/Routes/Routes";
import { isSet } from "components/utils";
import { getCharmsURLFromApplications } from "juju/api";
import CharmActionsPanel from "panels/ActionsPanel/CharmActionsPanel";
import CharmsPanel from "panels/CharmsPanel/CharmsPanel";
import { usePanelQueryParams } from "panels/hooks";
import {
  getModelUUIDFromList,
  getSelectedApplications,
} from "store/juju/selectors";
import { useAppStore } from "store/store";

import CharmActionsPanelTitle from "./CharmActionsPanelTitle";

export enum Label {
  CHARMS_PANEL_TITLE = "Choose applications of charm:",
}

export enum ClassName {
  CHARMS_PANEL = "charms-panel",
  CHARM_ACTIONS_PANEL = "actions-panel",
}

export enum TestId {
  PANEL = "charms-and-actions-panel",
}

type CharmsAndActionsQueryParams = {
  panel: string | null;
};

const CharmsAndActionsPanel = () => {
  const [charmURL, setCharmURL] = useState<string | null>();
  const defaultQueryParams: CharmsAndActionsQueryParams = {
    panel: null,
  };
  const [, , handleRemovePanelQueryParams] =
    usePanelQueryParams<CharmsAndActionsQueryParams>(defaultQueryParams);

  const selectedApplications = useSelector(getSelectedApplications());
  const appState = useAppStore().getState();
  const dispatch = useDispatch();
  const { userName, modelName } = useParams<EntityDetailsRoute>();
  const modelUUID = useSelector(getModelUUIDFromList(modelName, userName));

  useEffect(() => {
    // getCharmsURLFromApplications should be resolved only once after
    // selectedApplications and modelUUID are initialized. Once it is
    // resolved, isSet(charmURL) becomes true, thus triggering an early
    // return at each subsequent call of useEffect.
    if (!selectedApplications || !modelUUID || isSet(charmURL)) {
      return;
    }
    getCharmsURLFromApplications(
      selectedApplications,
      modelUUID,
      appState,
      dispatch
    ).then((charmsURL) => {
      const isCharmURLUnique = charmsURL.length === 1;
      setCharmURL(isCharmURLUnique ? charmsURL[0] : null);
    });
  }, [appState, charmURL, dispatch, modelUUID, selectedApplications]);

  return (
    <Panel
      width="narrow"
      panelClassName={
        charmURL ? ClassName.CHARM_ACTIONS_PANEL : ClassName.CHARMS_PANEL
      }
      data-testid={TestId.PANEL}
      title={
        charmURL ? (
          <CharmActionsPanelTitle charmURL={charmURL} />
        ) : (
          Label.CHARMS_PANEL_TITLE
        )
      }
      onRemovePanelQueryParams={handleRemovePanelQueryParams}
      loading={charmURL === undefined}
    >
      <>
        {charmURL && <CharmActionsPanel charmURL={charmURL} />}
        {!charmURL && <CharmsPanel onCharmURLChange={setCharmURL} />}
      </>
    </Panel>
  );
};

export default CharmsAndActionsPanel;
