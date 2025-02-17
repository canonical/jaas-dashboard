import type { JSX } from "react";

import AuditLogsTable from "components/AuditLogsTable";

const AuditLogs = (): JSX.Element => (
  <div className="entity-details__audit-logs">
    <AuditLogsTable />
  </div>
);

export default AuditLogs;
