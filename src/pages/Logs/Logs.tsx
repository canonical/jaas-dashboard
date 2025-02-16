import type { JSX } from "react";

import ActionBar from "components/ActionBar";
import AuditLogsTable from "components/AuditLogsTable/AuditLogsTable";
import AuditLogsTableActions from "components/AuditLogsTable/AuditLogsTableActions";
import BaseLayout from "layout/BaseLayout/BaseLayout";

import { TestId } from "./types";

const Logs = (): JSX.Element => (
  <BaseLayout data-testid={TestId.COMPONENT} title="Audit logs">
    <ActionBar>
      <AuditLogsTableActions />
    </ActionBar>
    <AuditLogsTable />
  </BaseLayout>
);

export default Logs;
