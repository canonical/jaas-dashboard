import { argPath } from "utils";

export type ModelTab = "apps" | "machines" | "integrations" | "action-logs";
export type AppTab = "machines" | "units";
export type ModelsGroupedBy = "status" | "cloud" | "owner";

const urls = {
  index: "/",
  controllers: "/controllers",
  model: {
    index: argPath<{ userName: string; modelName: string }>(
      "/models/:userName/:modelName"
    ),
    tab: argPath<{
      userName: string;
      modelName: string;
      tab: ModelTab;
    }>("/models/:userName/:modelName?activeView=:tab"),
    app: {
      index: argPath<{ userName: string; modelName: string; appName: string }>(
        "/models/:userName/:modelName/app/:appName"
      ),
      tab: argPath<{
        userName: string;
        modelName: string;
        appName: string;
        tab: AppTab;
      }>("/models/:userName/:modelName/app/:appName?tableView=:tab"),
    },
    machine: argPath<{
      userName: string;
      modelName: string;
      machineId: string;
    }>("/models/:userName/:modelName/machine/:machineId"),
    unit: argPath<{
      userName: string;
      modelName: string;
      appName: string;
      unitId: string;
    }>("/models/:userName/:modelName/app/:appName/unit/:unitId"),
  },
  models: {
    index: "/models",
    group: argPath<{
      groupedby: ModelsGroupedBy;
    }>("/models?groupedby=:groupedby"),
  },
  settings: "/settings",
};

export const externalURLs = {
  new_issue: "https://github.com/canonical/juju-dashboard/issues/new",
};

export default urls;
