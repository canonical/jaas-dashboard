import type { AllWatcherId } from "@canonical/jujulib/dist/api/facades/client/ClientV6";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useParams } from "react-router-dom";

import type { EntityDetailsRoute } from "components/Routes/Routes";
import { startModelWatcher, stopModelWatcher } from "juju/api";
import type { ConnectionWithFacades } from "juju/types";
import App from "pages/EntityDetails/App/App";
import EntityDetails from "pages/EntityDetails/EntityDetails";
import Machine from "pages/EntityDetails/Machine/Machine";
import Model from "pages/EntityDetails/Model/Model";
import Unit from "pages/EntityDetails/Unit/Unit";
import { actions as jujuActions } from "store/juju";
import { getModelUUIDFromList } from "store/juju/selectors";
import { useAppStore } from "store/store";
import urls from "urls";
import { getMajorMinorVersion, toErrorString } from "utils";

export enum Label {
  MODEL_WATCHER_ERROR = "Error while trying to stop model watcher.",
}

export default function ModelDetails() {
  const appState = useAppStore().getState();
  const dispatch = useDispatch();
  const { userName, modelName } = useParams<EntityDetailsRoute>();
  const modelUUID = useSelector(getModelUUIDFromList(modelName, userName));
  const [modelWatcherError, setModelWatcherError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let conn: ConnectionWithFacades | null = null;
    let pingerIntervalId: number | null = null;
    let watcherHandle: AllWatcherId | null = null;

    async function loadFullData() {
      try {
        const response = await startModelWatcher(modelUUID, appState, dispatch);
        conn = response.conn;
        watcherHandle = response.watcherHandle;
        pingerIntervalId = response.pingerIntervalId;
        // Fetch additional model data for pre Juju 3.2.
        if (getMajorMinorVersion(conn?.info.serverVersion) < 3.2) {
          const status = await conn?.facades.client?.fullStatus({
            patterns: [],
          });
          if (status) {
            dispatch(
              jujuActions.populateMissingAllWatcherData({
                uuid: modelUUID,
                status,
              }),
            );
          }
        }
        setModelWatcherError(null);
      } catch (error) {
        setModelWatcherError(toErrorString(error));
      }
    }
    if (modelUUID) {
      void loadFullData();
    }
    return () => {
      if (watcherHandle && pingerIntervalId && conn) {
        stopModelWatcher(
          conn,
          watcherHandle["watcher-id"],
          pingerIntervalId,
        ).catch((error) =>
          // Error doesn’t interfere with the user’s interaction with the
          // dashboard. Not shown in UI. Logged for debugging purposes.
          console.error(Label.MODEL_WATCHER_ERROR, error),
        );
      }
    };
    // Skipped as we need appState due to the call to `connectAndLoginToModel`
    // this method will need to be updated to take specific values instead of
    // the entire state.
    // eslint-disable-next-line
  }, [modelUUID]);

  const detailsRoute = urls.model.index(null);
  return (
    <Routes>
      <Route
        path="*"
        element={<EntityDetails modelWatcherError={modelWatcherError} />}
      >
        <Route path="" element={<Model />} />
        <Route
          path={urls.model.app.index(null, detailsRoute)}
          element={<App />}
        />
        <Route path={urls.model.unit(null, detailsRoute)} element={<Unit />} />
        <Route
          path={urls.model.machine(null, detailsRoute)}
          element={<Machine />}
        />
      </Route>
    </Routes>
  );
}
