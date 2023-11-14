import ActionBar from "components/ActionBar";
import AuditLogsTable from "components/AuditLogsTable/AuditLogsTable";
import AuditLogsTableActions from "components/AuditLogsTable/AuditLogsTableActions";
import BaseLayout from "layout/BaseLayout/BaseLayout";

const Logs = (): JSX.Element => (
  <BaseLayout title="Audit logs">
    <ActionBar>
      <AuditLogsTableActions />
    </ActionBar>
    <div className="u-overflow--auto">
      <AuditLogsTable />
    </div>
  </BaseLayout>
);

export default Logs;
