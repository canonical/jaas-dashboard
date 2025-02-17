import { useSelector } from "react-redux";

import ActionBar from "components/ActionBar";
import AuditLogsTableActions from "components/AuditLogsTable/AuditLogsTableActions";
import SegmentedControl from "components/SegmentedControl";
import { useQueryParams } from "hooks/useQueryParams";
import { useAuditLogsPermitted } from "juju/api-hooks/permissions";
import { getIsJuju } from "store/general/selectors";

import "./_logs.scss";
import ActionLogs from "./ActionLogs";
import AuditLogs from "./AuditLogs";
import { Label } from "./types";

const BUTTON_DETAILS = [
  { title: Label.ACTION_LOGS, url: "action-logs" },
  { title: Label.AUDIT_LOGS, url: "audit-logs" },
];

const Logs = () => {
  const isJuju = useSelector(getIsJuju);
  const { permitted: auditLogsAllowed } = useAuditLogsPermitted();
  const [{ tableView }, setQueryParams] = useQueryParams<{
    activeView: string | null;
    panel: string | null;
    tableView: string;
  }>({
    activeView: null,
    panel: null,
    tableView: "action-logs",
  });
  return (
    <div className="logs-tab">
      {!isJuju && (
        <ActionBar>
          <SegmentedControl
            buttons={BUTTON_DETAILS.map(({ title, url }) => ({
              children: title,
              key: url,
              onClick: () => {
                setQueryParams({ tableView: url });
              },
            }))}
            activeButton={tableView}
          />
          {tableView === "audit-logs" ? <AuditLogsTableActions /> : null}
        </ActionBar>
      )}
      {tableView === "action-logs" && <ActionLogs />}
      {auditLogsAllowed && tableView === "audit-logs" && <AuditLogs />}
    </div>
  );
};

export default Logs;
