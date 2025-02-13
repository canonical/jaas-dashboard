import { urls as generateReBACURLS } from "@canonical/rebac-admin";

import { argPath } from "utils";

export enum ModelTab {
  APPS = "apps",
  MACHINES = "machines",
  INTEGRATIONS = "integrations",
  LOGS = "logs",
  SECRETS = "secrets",
}

export type AppTab = "machines" | "units";
export type ModelsGroupedBy = "status" | "cloud" | "owner";

const urls = {
  index: "/",
  controllers: "/controllers",
  model: {
    index: argPath<{ userName: string; modelName: string }>(
      "/models/:userName/:modelName",
    ),
    tab: argPath<{
      userName: string;
      modelName: string;
      tab: ModelTab;
    }>("/models/:userName/:modelName?activeView=:tab"),
    app: {
      index: argPath<{ userName: string; modelName: string; appName: string }>(
        "/models/:userName/:modelName/app/:appName",
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
  logs: "/logs",
  permissions: "/permissions",
  search: "/search",
};

export const externalURLs = {
  newIssue: "https://github.com/canonical/juju-dashboard/issues/new",
  cliHelp: "https://juju.is/docs/olm/the-juju-web-cli",
};

export const rebacURLS = generateReBACURLS(urls.permissions);

export default urls;
