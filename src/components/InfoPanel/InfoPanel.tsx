import { usePortal, Modal } from "@canonical/react-components";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

import type { EntityDetailsRoute } from "components/Routes";
import Topology from "components/Topology";
import { getViewportWidth } from "components/utils";
import useAnalytics from "hooks/useAnalytics";
import {
  getModelAnnotations,
  getModelApplications,
  getModelRelations,
  getModelUUIDFromList,
} from "store/juju/selectors";

import "./_info-panel.scss";
import { Label, TestId } from "./types";

const expandedTopologyDimensions = () => {
  const de = document.documentElement;
  const vw = Math.max(de.clientWidth, window.innerWidth || 0);
  const vh = Math.max(de.clientHeight, window.innerHeight || 0);
  const delta = 300;
  return {
    width: vw - delta,
    height: vh - delta,
  };
};

const infoPanelDimensions = () => {
  const vw = getViewportWidth();
  // If changes are made to the 1580px breakpoint below then be sure to update
  // the same breakpoint in _info-panel.scss.
  const size = vw >= 1580 ? 300 : 180;
  return size;
};

const InfoPanel = () => {
  const { modelName, userName } = useParams<EntityDetailsRoute>();

  const {
    openPortal,
    closePortal,
    isOpen: showExpandedTopology,
    Portal,
  } = usePortal();

  const modelUUID = useSelector(getModelUUIDFromList(modelName, userName));
  const annotations = useSelector(getModelAnnotations(modelUUID));
  const applications = useSelector(getModelApplications(modelUUID));
  const relations = useSelector(getModelRelations(modelUUID));

  const applicationsCount = Object.keys(applications || {}).length;

  const { width, height } = expandedTopologyDimensions();
  const topologySize = infoPanelDimensions();

  const sendAnalytics = useAnalytics();

  const handleExpandTopology = (e: React.MouseEvent<HTMLButtonElement>) => {
    openPortal(e);
    sendAnalytics({
      path: undefined,
      category: "User",
      action: "Opened expanded topology",
    });
  };

  return (
    <div className="info-panel" data-testid={TestId.INFO_PANEL}>
      {showExpandedTopology && (
        <Portal>
          <Modal
            className="info-panel__modal"
            close={closePortal}
            title={modelName?.split("/")[1] || modelName}
          >
            <Topology
              width={width}
              height={height}
              annotations={annotations}
              applications={applications}
              relations={relations}
            />
          </Modal>
        </Portal>
      )}
      {applicationsCount > 0 && (
        <div className="info-panel__pictogram">
          <Topology
            width={topologySize}
            height={topologySize}
            annotations={annotations}
            applications={applications}
            relations={relations}
          />
          {modelName !== undefined && (
            <i
              className="p-icon--fullscreen"
              onClick={handleExpandTopology}
              role="button"
              tabIndex={0}
            >
              {Label.EXPAND_BUTTON}
            </i>
          )}
        </div>
      )}
    </div>
  );
};

export default InfoPanel;
