import { MainTable } from "@canonical/react-components";
import { useMemo } from "react";
import { useParams } from "react-router-dom";

import type { EntityDetailsRoute } from "components/Routes";
import useModelStatus from "hooks/useModelStatus";
import { remoteApplicationTableHeaders } from "tables/tableHeaders";
import { generateRemoteApplicationRows } from "tables/tableRows";

const RemoteAppsTable = () => {
  const { userName, modelName } = useParams<EntityDetailsRoute>();
  const modelStatusData = useModelStatus();
  const remoteApplicationTableRows = useMemo(() => {
    return modelName && userName
      ? generateRemoteApplicationRows(modelStatusData)
      : [];
  }, [modelStatusData, modelName, userName]);

  return (
    <MainTable
      headers={remoteApplicationTableHeaders}
      rows={remoteApplicationTableRows}
      className="entity-details__remote-apps p-main-table"
      sortable
      emptyStateMsg={"There are no remote applications in this model"}
    />
  );
};

export default RemoteAppsTable;
