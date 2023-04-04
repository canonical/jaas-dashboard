import { ReactNode } from "react";
import { SearchAndFilter, Spinner } from "@canonical/react-components";
import { SearchAndFilterChip } from "@canonical/react-components/dist/components/SearchAndFilter/types";
import { useSelector } from "react-redux";

import ButtonGroup from "components/ButtonGroup/ButtonGroup";
import ChipGroup from "components/ChipGroup/ChipGroup";
import Header from "components/Header/Header";
import ModelTableList from "components/ModelTableList/ModelTableList";
import BaseLayout from "layout/BaseLayout/BaseLayout";
import useModelAttributes from "hooks/useModelAttributes";
import { useQueryParams } from "hooks/useQueryParams";
import useWindowTitle from "hooks/useWindowTitle";
import FadeIn from "animations/FadeIn";
import { pluralize } from "store/juju/utils/models";
import {
  getGroupedModelStatusCounts,
  getModelData,
  getModelListLoaded,
  hasModels,
} from "store/juju/selectors";
import { useAppSelector } from "store/store";
import { Link } from "react-router-dom";
import urls, { ModelsGroupedBy } from "urls";

import "./_models.scss";

export enum Label {
  NOT_FOUND = "No models found",
}

export enum TestId {
  LOADING = "loading-spinner",
}

export default function Models() {
  useWindowTitle("Models");

  const [queryParams, setQueryParams] = useQueryParams<{
    groupedby: string;
    cloud: string[];
    owner: string[];
    region: string[];
    credential: string[];
    custom: string[];
  }>({
    groupedby: "status",
    cloud: [],
    owner: [],
    region: [],
    credential: [],
    custom: [],
  });
  const filters = {
    cloud: queryParams.cloud,
    owner: queryParams.owner,
    region: queryParams.region,
    credential: queryParams.credential,
    custom: queryParams.custom,
  };

  const modelsLoaded = useAppSelector(getModelListLoaded);
  const hasSomeModels = useSelector(hasModels);
  // loop model data and pull out filter panel data
  const modelData = useSelector(getModelData);
  const { clouds, regions, owners, credentials } =
    useModelAttributes(modelData);

  // Generate chips from available model data
  const generateChips = (lead: string, values: string[]) => {
    let chipValues: SearchAndFilterChip[] = [];
    values.forEach((value) => {
      chipValues.push({ lead, value });
    });
    return chipValues;
  };

  const { blocked, alert, running } = useSelector(getGroupedModelStatusCounts);

  let activeFilters: Record<string, string[]> = {};

  const isObjectsEqual = (
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>
  ) => JSON.stringify(obj1) === JSON.stringify(obj2);

  const existingSearchData: SearchAndFilterChip[] = [];
  for (const [lead, values] of Object.entries(filters)) {
    values.forEach((value) => {
      if (value) {
        existingSearchData.push({ lead, value });
      }
    });
  }

  const modelCount = blocked + alert + running;

  let content: ReactNode;
  if (!modelsLoaded) {
    return (
      <div className="entity-details__loading" data-testid={TestId.LOADING}>
        <Spinner />
      </div>
    );
  } else if (!hasSomeModels) {
    content = (
      <div className="l-content">
        <div className="models">
          <h3>{Label.NOT_FOUND}</h3>
          <p>
            Learn about{" "}
            <a href="https://juju.is/docs/olm/manage-models#heading--add-a-model">
              adding models
            </a>{" "}
            or{" "}
            <a href="https://juju.is/docs/olm/manage-users#heading--model-access">
              granting access
            </a>{" "}
            to existing models.
          </p>
        </div>
      </div>
    );
  } else {
    content = (
      <FadeIn isActive={modelsLoaded}>
        <div className="l-content">
          <div className="models">
            <ChipGroup chips={{ blocked, alert, running }} />
            <ModelTableList
              groupedBy={queryParams.groupedby}
              filters={filters}
            />
          </div>
        </div>
      </FadeIn>
    );
  }

  return (
    <BaseLayout>
      <Header>
        <div className="models__header" data-disabled={modelCount === 0}>
          <strong className="models__count">
            {modelCount} {pluralize(modelCount, "model")}
          </strong>
          <ButtonGroup
            activeButton={queryParams.groupedby}
            buttons={["status", "cloud", "owner"].map((group) => ({
              children: group,
              key: group,
              to: urls.models.group({
                groupedby: group as ModelsGroupedBy,
              }),
            }))}
            buttonComponent={Link}
            label="Group by:"
            noWrap
          />
          <SearchAndFilter
            filterPanelData={[
              {
                id: 0,
                heading: "Cloud",
                chips: generateChips("Cloud", clouds),
              },
              {
                id: 1,
                heading: "Region",
                chips: generateChips("Region", regions),
              },
              {
                id: 2,
                heading: "Owner",
                chips: generateChips("Owner", owners),
              },
              {
                id: 3,
                heading: "Credential",
                chips: generateChips("Credential", credentials),
              },
            ]}
            existingSearchData={existingSearchData}
            returnSearchData={(searchData) => {
              // Reset active filters
              activeFilters = {
                cloud: [],
                owner: [],
                region: [],
                credential: [],
                custom: [],
              };

              // Loop search data and pull out each filter
              searchData.length &&
                searchData.forEach(({ lead, value }) => {
                  const chipLead = lead ? lead.toLowerCase() : "custom";
                  if (!(chipLead in activeFilters)) {
                    activeFilters[chipLead] = [];
                  }
                  activeFilters[chipLead].push(value);
                });

              if (!isObjectsEqual(activeFilters, filters)) {
                setQueryParams(activeFilters);
              }
            }}
          />
        </div>
      </Header>

      {content}
    </BaseLayout>
  );
}
