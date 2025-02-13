import { MainTable } from "@canonical/react-components";
import type { MainTableRow } from "@canonical/react-components/dist/components/MainTable/MainTable";
import { useSelector } from "react-redux";

import ModelDetailsLink from "components/ModelDetailsLink";
import TruncatedTooltip from "components/TruncatedTooltip";
import {
  getActiveUsers,
  getControllerData,
  getGroupedByStatusAndFilteredModelData,
} from "store/juju/selectors";
import type { Controllers, ModelData } from "store/juju/types";
import type { Filters, Status } from "store/juju/utils/models";
import { canAdministerModel, extractOwnerName } from "store/juju/utils/models";

import AccessButton from "../AccessButton/AccessButton";
import CloudCell from "../CloudCell/CloudCell";
import ModelSummary from "../ModelSummary";
import {
  generateCloudAndRegion,
  generateTableHeaders,
  getControllerName,
  getCredential,
  getLastUpdated,
} from "../shared";

import WarningMessage from "./WarningMessage";
import { TestId } from "./types";

/**
  Generates the model name cell.
  @param model The model data.
  @param groupLabel The status group the model belongs in.
    e.g. blocked, alert, running
  @returns The React element for the model name cell.
*/
const generateModelNameCell = (model: ModelData, groupLabel: string) => {
  return (
    <>
      <TruncatedTooltip message={model.model.name}>
        <ModelDetailsLink
          modelName={model.model.name}
          ownerTag={model.info?.["owner-tag"]}
        >
          {model.model.name}
        </ModelDetailsLink>
      </TruncatedTooltip>
      {groupLabel === "blocked" ? <WarningMessage model={model} /> : null}
    </>
  );
};

/**
  Returns the model info and statuses in the proper format for the table data.
  @param  groupedModels The models grouped by state
  @return The formatted table data.
*/
function generateModelTableDataByStatus(
  groupedModels: Record<Status, ModelData[]>,
  activeUsers: Record<string, string>,
  controllers: Controllers | null,
) {
  const modelData: Record<string, MainTableRow[]> = {
    blockedRows: [],
    alertRows: [],
    runningRows: [],
  };

  Object.keys(groupedModels).forEach((groupLabel) => {
    const models = groupedModels[groupLabel as Status];

    models.forEach((model) => {
      let owner = "";
      if (model.info) {
        owner = extractOwnerName(model.info["owner-tag"]);
      }
      const activeUser = activeUsers[model.uuid];
      const cloud = <CloudCell model={model} />;
      const credential = getCredential(model);
      const controller = getControllerName(model, controllers);
      const lastUpdated = getLastUpdated(model);
      const row = {
        "data-testid": `model-uuid-${model?.uuid}`,
        columns: [
          {
            "data-testid": "column-name",
            content: generateModelNameCell(model, groupLabel),
          },
          {
            "data-testid": "column-summary",
            content: (
              <ModelSummary
                modelData={model}
                ownerTag={model.info?.["owner-tag"]}
              />
            ),
            className: "u-overflow--visible",
          },
          {
            "data-testid": "column-owner",
            content: (
              <TruncatedTooltip message={owner}>{owner}</TruncatedTooltip>
            ),
          },
          {
            "data-testid": "column-cloud",
            content: (
              <TruncatedTooltip message={generateCloudAndRegion(model)}>
                {cloud}
              </TruncatedTooltip>
            ),
          },
          {
            "data-testid": "column-credential",
            content: (
              <TruncatedTooltip message={credential}>
                {credential}
              </TruncatedTooltip>
            ),
          },
          {
            "data-testid": "column-controller",
            content: (
              <TruncatedTooltip message={controller}>
                {controller}
              </TruncatedTooltip>
            ),
          },
          // We're not currently able to get a last-accessed or updated from JAAS.
          {
            "data-testid": "column-updated",
            content: (
              <>
                {canAdministerModel(activeUser, model?.info?.users) && (
                  <AccessButton modelName={model.model.name} />
                )}
                <span className="model-access-alt">{lastUpdated}</span>
              </>
            ),
            className: `u-align--right lrg-screen-access-cell ${
              canAdministerModel(activeUser, model?.info?.users)
                ? "has-permission"
                : ""
            }`,
          },
        ],
        sortData: {
          name: model.model.name,
          owner,
          cloud,
          credential,
          controller,
          lastUpdated,
        },
      };
      modelData[`${groupLabel}Rows`].push(row);
    });
  });

  return modelData;
}

export default function StatusGroup({ filters }: { filters: Filters }) {
  const groupedAndFilteredData = useSelector(
    getGroupedByStatusAndFilteredModelData(filters),
  );
  const controllers = useSelector(getControllerData);
  const activeUsers = useSelector(getActiveUsers);

  const { blockedRows, alertRows, runningRows } =
    generateModelTableDataByStatus(
      groupedAndFilteredData,
      activeUsers,
      controllers,
    );

  const emptyStateMsg = "There are no models with this status";

  return (
    <div className="status-group" data-testid={TestId.STATUS_GROUP}>
      {blockedRows.length ? (
        <MainTable
          headers={generateTableHeaders("Blocked", blockedRows.length, {
            showCloud: true,
            showOwner: true,
            showHeaderStatus: true,
          })}
          rows={blockedRows}
          sortable
          emptyStateMsg={emptyStateMsg}
          className="p-main-table"
        />
      ) : null}
      {alertRows.length ? (
        <MainTable
          headers={generateTableHeaders("Alert", alertRows.length, {
            showCloud: true,
            showOwner: true,
          })}
          rows={alertRows}
          sortable
          emptyStateMsg={emptyStateMsg}
          className="p-main-table"
        />
      ) : null}
      {runningRows.length ? (
        <MainTable
          headers={generateTableHeaders("Running", runningRows.length, {
            showCloud: true,
            showOwner: true,
          })}
          rows={runningRows}
          sortable
          emptyStateMsg={emptyStateMsg}
          className="p-main-table"
        />
      ) : null}
    </div>
  );
}
