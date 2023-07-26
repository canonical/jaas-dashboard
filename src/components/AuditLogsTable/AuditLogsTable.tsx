import { ModularTable, Tooltip } from "@canonical/react-components";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import type { Column } from "react-table";

import type { EntityDetailsRoute } from "components/Routes/Routes";
import { formatFriendlyDateToNow } from "components/utils";
import { generateFakeAuditLogs } from "pages/Logs/audit-logs-fake-data";
import getUserName from "utils/getUserName";

const COLUMN_DATA: Column[] = [
  {
    Header: "user",
    accessor: "user",
  },
  {
    Header: "model",
    accessor: "model",
  },
  {
    Header: "time",
    accessor: "time",
  },
  {
    Header: "facade name",
    accessor: "facadeName",
  },
  {
    Header: "facade method",
    accessor: "facadeMethod",
  },
  {
    Header: "facade version",
    accessor: "facadeVersion",
  },
];

const AuditLogsTable = () => {
  const { modelName } = useParams<EntityDetailsRoute>();
  const emptyMsg = `There are no audit logs available yet for ${modelName}`;

  const fakeTableData = useMemo(() => {
    const auditLogsData = generateFakeAuditLogs();
    const tableData = auditLogsData.map((auditLogsEntry) => {
      const time = (
        <Tooltip
          message={new Date(auditLogsEntry.time).toLocaleString()}
          position="top-center"
        >
          {formatFriendlyDateToNow(auditLogsEntry.time)}
        </Tooltip>
      );
      const user = getUserName(auditLogsEntry["user-tag"]);
      const facadeName = auditLogsEntry["facade-name"];
      const facadeMethod = auditLogsEntry["facade-method"];
      const facadeVersion = auditLogsEntry["facade-version"];
      return {
        model: auditLogsEntry.model,
        time,
        user,
        facadeName,
        facadeMethod,
        facadeVersion,
      };
    });
    return tableData;
  }, []);

  return (
    <ModularTable
      columns={COLUMN_DATA}
      data={fakeTableData}
      emptyMsg={emptyMsg}
    />
  );
};

export default AuditLogsTable;
