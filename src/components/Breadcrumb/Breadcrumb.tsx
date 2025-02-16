import type { JSX, ReactNode } from "react";
import { Link } from "react-router";

import { useEntityDetailsParams } from "components/hooks";
import urls from "urls";
import { ModelTab } from "urls";

import "./_breadcrumbs.scss";

export default function Breadcrumb(): JSX.Element {
  const {
    userName,
    modelName,
    appName,
    unitId,
    machineId,
    isNestedEntityPage,
  } = useEntityDetailsParams();

  const generateBreadcrumbs = function (): ReactNode {
    const view = machineId ? ModelTab.MACHINES : ModelTab.APPS;
    if (!userName || !modelName) {
      return null;
    }

    if (isNestedEntityPage) {
      return (
        <>
          <li
            className="p-breadcrumbs__item u-no-padding--top"
            data-testid="breadcrumb-model"
          >
            <Link to={urls.model.index({ userName, modelName })}>
              {modelName}
            </Link>
          </li>
          {!unitId && (
            <li
              className="p-breadcrumbs__item u-no-padding--top"
              data-testid="breadcrumb-section"
            >
              <Link to={urls.model.tab({ userName, modelName, tab: view })}>
                {entityType.title}
              </Link>
            </li>
          )}
          {unitId && (
            <>
              <li
                className="p-breadcrumbs__item u-no-padding--top"
                data-testid="breadcrumb-section"
              >
                <Link
                  to={urls.model.tab({
                    userName,
                    modelName,
                    tab: ModelTab.APPS,
                  })}
                >
                  Applications
                </Link>
              </li>
              <li
                className="p-breadcrumbs__item u-no-padding--top"
                data-testid="breadcrumb-app"
              >
                {appName ? (
                  <Link
                    to={urls.model.app.index({ userName, modelName, appName })}
                  >
                    {appName}
                  </Link>
                ) : null}
              </li>
            </>
          )}
          <li
            className="p-breadcrumbs__item u-no-padding--top"
            data-testid={`breadcrumb-${entityType.title?.toLowerCase()}`}
          >
            <strong>{entityType.id}</strong>
          </li>
        </>
      );
    }
    return (
      <li
        className="p-breadcrumbs__item p-breadcrumbs__item--restricted"
        data-testid="breadcrumb-model"
        title={modelName}
      >
        <Link
          to={urls.model.index({ userName, modelName })}
          className="p-link--soft"
        >
          <strong>{modelName}</strong>
        </Link>
      </li>
    );
  };

  type EntityType = {
    id: string | undefined;
    title: string | undefined;
  };

  const entityType: EntityType = {
    id: undefined,
    title: undefined,
  };

  if (appName) {
    entityType.id = appName;
    entityType.title = "Applications";
  }

  if (unitId) {
    entityType.id = unitId;
    entityType.title = "Units";
  }

  if (machineId) {
    entityType.id = machineId;
    entityType.title = "Machines";
  }

  return (
    <nav className="p-breadcrumbs" aria-label="Breadcrumb navigation">
      <ol className="p-breadcrumbs__items" data-testid="breadcrumb-items">
        {generateBreadcrumbs()}
      </ol>
    </nav>
  );
}
