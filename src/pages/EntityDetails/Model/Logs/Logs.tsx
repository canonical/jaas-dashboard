import ButtonGroup from "components/ButtonGroup/ButtonGroup";
import { useQueryParams } from "hooks/useQueryParams";

import ActionLogs from "./ActionLogs";

import "./_logs.scss";

const Logs = () => {
  const [{ activeView }, setQueryParams] = useQueryParams<{
    activeView: string | null;
  }>({
    activeView: null,
  });
  return (
    <div className="logs-tab">
      <ButtonGroup
        buttons={[{ title: "Action logs", url: "action-logs" }].map(
          ({ title, url }) => ({
            children: title,
            key: url,
            onClick: () => {
              setQueryParams({ activeView: url });
            },
          })
        )}
        activeButton={activeView}
      />
      {activeView === "action-logs" ? <ActionLogs /> : null}
    </div>
  );
};

export default Logs;
