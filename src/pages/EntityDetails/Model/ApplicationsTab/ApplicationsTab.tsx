import { Button, Icon, MainTable } from "@canonical/react-components";
import type { MainTableRow } from "@canonical/react-components/dist/components/MainTable/MainTable";
import classnames from "classnames";
import Fuse from "fuse.js";
import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import type { Chip } from "components/ChipGroup/ChipGroup";
import ChipGroup from "components/ChipGroup/ChipGroup";
import ContentReveal from "components/ContentReveal/ContentReveal";
import type { EntityDetailsRoute } from "components/Routes/Routes";
import useAnalytics from "hooks/useAnalytics";
import useModelStatus from "hooks/useModelStatus";
import { useQueryParams } from "hooks/useQueryParams";
import type { ApplicationData, ApplicationInfo } from "juju/types";
import {
  getAllModelApplicationStatus,
  getModelApplications,
  getModelUUIDFromList,
  getSelectedApplications,
} from "store/juju/selectors";
import { pluralize } from "store/juju/utils/models";
import {
  appsOffersTableHeaders,
  generateLocalApplicationTableHeaders,
  remoteApplicationTableHeaders,
} from "tables/tableHeaders";
import {
  generateAppOffersRows,
  generateLocalApplicationRows,
  generateRemoteApplicationRows,
} from "tables/tableRows";

import { renderCounts } from "../../counts";

import {
  addSelectAllColumn,
  addSelectColumn,
  useTableSelect,
} from "./useTableSelect";

const ContentRevealTitle = ({
  count,
  subject,
  chips,
}: {
  count: number;
  subject: "Offer" | "Local application" | "Remote application";
  chips: Chip | null;
}) => (
  <>
    <span>
      {count} {pluralize(count, subject)}
    </span>
    <ChipGroup chips={chips} className="u-no-margin" descriptor={null} />
  </>
);

function SearchResultsActionsRow() {
  const selectedApplications = useSelector(getSelectedApplications());
  const sendAnalytics = useAnalytics();

  const [, setPanel] = useQueryParams<{ panel: string | null }>({
    panel: null,
  });

  const handleRunAction = async (event: MouseEvent) => {
    event.stopPropagation();
    sendAnalytics({
      category: "ApplicationSearch",
      action: "Run action (button)",
    });
    setPanel({ panel: "select-charms-and-actions" }, { replace: true });
  };

  return (
    <div className="applications-search-results__actions-row">
      <Button
        appearance="base"
        className="entity-details__action-button"
        hasIcon={true}
        onClick={handleRunAction}
        disabled={!selectedApplications.length}
      >
        <Icon name="run-action" />
        <span>Run action</span>
      </Button>
    </div>
  );
}

type Props = {
  filterQuery?: string;
};

export default function ApplicationsTab({ filterQuery }: Props) {
  const [queryParams] = useQueryParams<{
    entity: string | null;
    panel: string | null;
    activeView: string;
  }>({
    panel: null,
    entity: null,
    activeView: "apps",
  });
  const { userName, modelName } = useParams<EntityDetailsRoute>();

  const modelStatusData = useModelStatus();
  const modelUUID = useSelector(getModelUUIDFromList(modelName, userName));
  const applications = useSelector(getModelApplications(modelUUID));
  const applicationStatuses = useSelector(
    getAllModelApplicationStatus(modelUUID)
  );
  const [filteredApplications, setFilteredApplications] =
    useState<ApplicationData>({});
  const [fuse, setFuse] = useState<Fuse<ApplicationInfo>>(new Fuse([]));

  const { handleSelect, handleSelectAll, selectAll, reset } = useTableSelect(
    Object.values(filteredApplications)
  );

  useMemo(() => {
    if (applications)
      setFuse(
        new Fuse(Object.values(applications), {
          keys: ["name", "charm-url", "owner-tag", "constraints.arch"],
        })
      );
  }, [applications]);

  useEffect(() => {
    if (!applications) return;
    if (!filterQuery) {
      // include all applications by default
      setFilteredApplications(applications);
    } else {
      const searchedApps = fuse.search(filterQuery).map((e) => e.item);
      const filteredApplications: ApplicationData = {};
      searchedApps.forEach((application) => {
        if ("name" in application && applications[application.name]) {
          filteredApplications[application.name] = application;
        }
      });
      setFilteredApplications(filteredApplications);
      // on new search, reset applications selection
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuse, filterQuery, applications]);

  const localApplicationTableRows: MainTableRow[] = useMemo(() => {
    return modelName && userName
      ? generateLocalApplicationRows(
          filteredApplications,
          applicationStatuses,
          { modelName, userName },
          queryParams
        )
      : [];
  }, [
    filteredApplications,
    applicationStatuses,
    modelName,
    userName,
    queryParams,
  ]);

  const remoteApplicationTableRows = useMemo(() => {
    return modelName && userName
      ? generateRemoteApplicationRows(
          modelStatusData,
          { modelName, userName },
          queryParams
        )
      : [];
  }, [modelStatusData, modelName, userName, queryParams]);

  const appOffersRows = useMemo(
    () => generateAppOffersRows(modelStatusData, queryParams),
    [modelStatusData, queryParams]
  );
  const LocalAppChips = renderCounts("localApps", modelStatusData);
  const appOffersChips = renderCounts("offers", modelStatusData);
  const remoteAppChips = renderCounts("remoteApps", modelStatusData);

  const localAppTableLength = localApplicationTableRows?.length;
  const appOffersTableLength = appOffersRows?.length;

  const remoteAppsTableLength = remoteApplicationTableRows?.length;

  const countVisibleTables = (tablesLengths: number[]) =>
    tablesLengths.filter((rowLength) => rowLength > 0).length;

  const visibleTables = countVisibleTables([
    localAppTableLength,
    remoteAppsTableLength,
    appOffersTableLength,
  ]);

  const AppOffersTable = () => (
    <>
      {!!appOffersTableLength && (
        <>
          <MainTable
            headers={appsOffersTableHeaders}
            rows={appOffersRows}
            className="entity-details__offers p-main-table"
            sortable
            emptyStateMsg={"There are no offers associated with this model"}
          />
        </>
      )}
    </>
  );

  const LocalAppsTable = () => {
    let headers = generateLocalApplicationTableHeaders();
    let rows = localApplicationTableRows;
    if (filterQuery) {
      headers = addSelectAllColumn(headers, selectAll, handleSelectAll);
      rows = addSelectColumn(rows, filteredApplications, handleSelect);
    }
    return (
      <>
        {filterQuery && <SearchResultsActionsRow />}
        <MainTable
          headers={headers}
          rows={rows}
          className={classnames("entity-details__apps p-main-table", {
            selectable: filterQuery,
          })}
          sortable
          emptyStateMsg={"There are no local applications in this model"}
        />
      </>
    );
  };

  const RemoteAppsTable = () => (
    <>
      {!!remoteAppsTableLength && (
        <MainTable
          headers={remoteApplicationTableHeaders}
          rows={remoteApplicationTableRows}
          className="entity-details__remote-apps p-main-table"
          sortable
          emptyStateMsg={"There are no remote applications in this model"}
        />
      )}
    </>
  );
  const getContentReveals = () => {
    return (
      <>
        {!!appOffersTableLength && (
          <ContentReveal
            title={
              <ContentRevealTitle
                count={appOffersTableLength}
                subject="Offer"
                chips={appOffersChips}
              />
            }
            openByDefault={true}
          >
            {<AppOffersTable />}
          </ContentReveal>
        )}
        {!!localAppTableLength && (
          <ContentReveal
            title={
              <ContentRevealTitle
                count={localAppTableLength}
                subject="Local application"
                chips={LocalAppChips}
              />
            }
            openByDefault={true}
          >
            {<LocalAppsTable />}
          </ContentReveal>
        )}
        {!!remoteAppsTableLength && (
          <ContentReveal
            title={
              <ContentRevealTitle
                count={remoteAppsTableLength}
                subject="Remote application"
                chips={remoteAppChips}
              />
            }
            openByDefault={true}
          >
            {<RemoteAppsTable />}
          </ContentReveal>
        )}
      </>
    );
  };
  if (visibleTables === 0) {
    return (
      <span>
        There are no applications associated with this model. Learn about{" "}
        <a
          className="p-link--external"
          href="https://juju.is/docs/deploying-applications"
        >
          deploying applications
        </a>
      </span>
    );
  } else if (visibleTables > 1) {
    return getContentReveals();
  } else {
    return (
      <>
        <AppOffersTable />
        <LocalAppsTable />
        <RemoteAppsTable />
      </>
    );
  }
}
