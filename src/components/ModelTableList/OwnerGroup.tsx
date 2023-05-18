import { MainTable } from "@canonical/react-components";
import type { MainTableRow } from "@canonical/react-components/dist/components/MainTable/MainTable";
import type { ReactNode } from "react";
import { useSelector } from "react-redux";

import Status from "components/Status";
import TruncatedTooltip from "components/TruncatedTooltip";
import { useQueryParams } from "hooks/useQueryParams";
import {
  getActiveUsers,
  getControllerData,
  getGroupedByOwnerAndFilteredModelData,
} from "store/juju/selectors";
import type { Filters } from "store/juju/utils/models";
import {
  canAdministerModelAccess,
  getModelStatusGroupData,
} from "store/juju/utils/models";

import AccessButton from "./AccessButton";
import CloudCell from "./CloudCell/CloudCell";
import ModelDetailsLink from "./ModelDetailsLink";
import ModelSummary from "./ModelSummary";
import {
  generateCloudAndRegion,
  getControllerName,
  getCredential,
  getLastUpdated,
} from "./shared";

type Props = {
  filters: Filters;
};

export enum TestId {
  OWNER_GROUP = "owner-group",
}

/**
  Generates the table headers for the owner grouped table
  @param owner The title of the table.
  @param count The number of elements in the status.
  @returns The headers for the table.
*/
function generateOwnerTableHeaders(owner: string, count: number) {
  return [
    {
      content: <Status status={owner} count={count} />,
      sortKey: "name",
    },
    { content: "", sortKey: "summary" }, // The unit/machines/apps counts
    { content: "Status", sortKey: "status" },
    { content: "Cloud/Region", sortKey: "cloud" },
    { content: "Credential", sortKey: "credential" },
    { content: "Controller", sortKey: "controller" },
    {
      content: "Last Updated",
      sortKey: "lastUpdated",
      className: "u-align--right",
    },
    {
      content: "",
      sortKey: "",
      className: "sm-screen-access-header",
    },
  ];
}

export default function OwnerGroup({ filters }: Props) {
  const groupedAndFilteredData = useSelector(
    getGroupedByOwnerAndFilteredModelData(filters)
  );
  const [, setPanelQs] = useQueryParams({
    model: null,
    panel: null,
  });
  const activeUsers = useSelector(getActiveUsers);
  const controllers = useSelector(getControllerData);

  const ownerTables: ReactNode[] = [];
  for (const owner in groupedAndFilteredData) {
    const ownerModels: MainTableRow[] = [];
    Object.values(groupedAndFilteredData[owner]).forEach((model) => {
      const activeUser = activeUsers[model.uuid];
      const { highestStatus } = getModelStatusGroupData(model);
      const cloud = <CloudCell model={model} />;
      const credential = getCredential(model);
      const controller = getControllerName(model, controllers);
      const lastUpdated = getLastUpdated(model);
      const row = {
        "data-testid": `model-uuid-${model?.uuid}`,
        columns: [
          {
            "data-testid": "column-name",
            content: model.info ? (
              <ModelDetailsLink
                modelName={model.info.name}
                ownerTag={model.info?.["owner-tag"]}
              >
                {model.info.name}
              </ModelDetailsLink>
            ) : null,
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
            "data-testid": "column-status",
            content: <Status status={highestStatus} />,
            className: "u-capitalise",
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
            content: credential,
          },
          {
            "data-testid": "column-controller",
            content: controller,
          },
          {
            "data-testid": "column-updated",
            content: (
              <>
                {model.info
                  ? canAdministerModelAccess(activeUser, model.info.users) && (
                      <AccessButton
                        setPanelQs={setPanelQs}
                        modelName={model.info.name}
                      />
                    )
                  : null}
                <span className="model-access-alt">{lastUpdated}</span>
              </>
            ),
            className: `u-align--right lrg-screen-access-cell ${
              canAdministerModelAccess(activeUser, model?.info?.users)
                ? "has-permission"
                : ""
            }`,
          },
          {
            content: (
              <>
                {model.info
                  ? canAdministerModelAccess(
                      activeUser,
                      model?.info?.users
                    ) && (
                      <AccessButton
                        setPanelQs={setPanelQs}
                        modelName={model.info.name}
                      />
                    )
                  : null}
              </>
            ),
            className: "sm-screen-access-cell",
          },
        ],
        sortData: {
          name: model.info?.name,
          status: highestStatus,
          cloud,
          credential,
          controller,
          lastUpdated,
        },
      };
      ownerModels.push(row);
    });

    ownerTables.push(
      <MainTable
        key={owner}
        headers={generateOwnerTableHeaders(owner, ownerModels.length)}
        rows={ownerModels}
        sortable
        className="p-main-table"
      />
    );
  }
  return (
    <div
      className="owners-group u-overflow--auto"
      data-testid={TestId.OWNER_GROUP}
    >
      {ownerTables}
    </div>
  );
}
