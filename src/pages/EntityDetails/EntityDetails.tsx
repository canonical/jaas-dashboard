import { Button, Notification, Strip, Tabs } from "@canonical/react-components";
import classNames from "classnames";
import type { ReactNode, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, Link, Outlet } from "react-router";

import Breadcrumb from "components/Breadcrumb";
import LoadingSpinner from "components/LoadingSpinner";
import NotFound from "components/NotFound";
import type { EntityDetailsRoute } from "components/Routes";
import WebCLI from "components/WebCLI";
import { useEntityDetailsParams } from "components/hooks";
import useCanConfigureModel from "hooks/useCanConfigureModel";
import { useQueryParams } from "hooks/useQueryParams";
import useWindowTitle from "hooks/useWindowTitle";
import BaseLayout from "layout/BaseLayout/BaseLayout";
import { getIsJuju, getUserPass } from "store/general/selectors";
import {
  getCanListSecrets,
  getControllerDataByUUID,
  getModelInfo,
  getModelListLoaded,
  getModelUUIDFromList,
  isKubernetesModel,
} from "store/juju/selectors";
import { useAppSelector } from "store/store";
import urls from "urls";
import { ModelTab } from "urls";
import { getMajorMinorVersion } from "utils";

import "./_entity-details.scss";
import { Label, TestId } from "./types";

type Props = {
  modelWatcherError?: string | null;
};

const getEntityType = (params: Partial<EntityDetailsRoute>) => {
  if (params.unitId) {
    return "unit";
  } else if (params.machineId) {
    return "machine";
  } else if (params.appName) {
    return "app";
  }
  return "model";
};

const EntityDetails = ({ modelWatcherError }: Props) => {
  const routeParams = useParams<EntityDetailsRoute>();
  const { userName, modelName } = routeParams;
  const modelsLoaded = useAppSelector(getModelListLoaded);
  const modelUUID = useSelector(getModelUUIDFromList(modelName, userName));
  const modelInfo = useSelector(getModelInfo(modelUUID));
  const isK8s = useAppSelector((state) => isKubernetesModel(state, modelUUID));
  const { isNestedEntityPage } = useEntityDetailsParams();

  // Cleanup is set for this hook, but not for the instances of
  // useCanConfigureModel in other model components as this component wraps all
  // model routes so the model permissions are removed once the user navigates
  // away from the model.
  useCanConfigureModel(true);

  const isJuju = useSelector(getIsJuju);

  const [query] = useQueryParams({
    panel: null,
    entity: null,
    activeView: "apps",
    filterQuery: "",
  });

  const { activeView } = query;

  const [showWebCLI, setShowWebCLI] = useState(false);

  // In a JAAS environment the controllerUUID will be the sub controller not
  // the primary controller UUID that we connect to.
  const controllerUUID = modelInfo?.["controller-uuid"];
  // The primary controller data is the controller endpoint we actually connect
  // to. In the case of a normally bootstrapped controller this will be the
  // same as the model controller, however in a JAAS environment, this primary
  // controller will be JAAS and the model controller will be different.
  const primaryControllerData = useSelector(
    getControllerDataByUUID(controllerUUID),
  );
  const entityType = getEntityType(routeParams);
  const canListSecrets = useAppSelector((state) =>
    getCanListSecrets(state, modelUUID),
  );
  const credentials = useAppSelector((state) =>
    getUserPass(state, primaryControllerData?.[0]),
  );
  const controllerWSHost =
    primaryControllerData?.[0]
      .replace("ws://", "")
      .replace("wss://", "")
      .replace("/api", "") || null;
  const wsProtocol = primaryControllerData?.[0].split("://")[0];

  const handleNavClick = (e: MouseEvent) => {
    (e.target as HTMLAnchorElement)?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  };

  useEffect(() => {
    if (isJuju && getMajorMinorVersion(modelInfo?.version) >= 2.9) {
      // The Web CLI is only available in Juju controller versions 2.9 and
      // above. This will allow us to only show the shell on multi-controller
      // setups with different versions where the correct controller version
      // is available.
      setShowWebCLI(true);
    }
  }, [modelInfo, isJuju]);

  useWindowTitle(modelInfo?.name ? `Model: ${modelInfo?.name}` : "...");

  const generateTabItems = () => {
    if (!userName || !modelName) {
      return [];
    }
    const items = [
      {
        active: activeView === ModelTab.APPS,
        label: "Applications",
        onClick: (e: MouseEvent) => handleNavClick(e),
        to: urls.model.tab({ userName, modelName, tab: ModelTab.APPS }),
        component: Link,
      },
      {
        active: activeView === ModelTab.INTEGRATIONS,
        label: "Integrations",
        onClick: (e: MouseEvent) => handleNavClick(e),
        to: urls.model.tab({ userName, modelName, tab: ModelTab.INTEGRATIONS }),
        component: Link,
      },
      {
        active: activeView === "logs",
        label: isJuju ? "Action Logs" : "Logs",
        onClick: (e: MouseEvent) => handleNavClick(e),
        to: urls.model.tab({ userName, modelName, tab: ModelTab.LOGS }),
        component: Link,
      },
    ];

    if (canListSecrets) {
      items.push({
        active: activeView === "secrets",
        label: "Secrets",
        onClick: (e: MouseEvent) => handleNavClick(e),
        to: urls.model.tab({ userName, modelName, tab: ModelTab.SECRETS }),
        component: Link,
      });
    }

    if (!isK8s) {
      items.push({
        active: activeView === ModelTab.MACHINES,
        label: "Machines",
        onClick: (e: MouseEvent) => handleNavClick(e),
        to: urls.model.tab({ userName, modelName, tab: ModelTab.MACHINES }),
        component: Link,
      });
    }

    return items;
  };

  let content: ReactNode;
  if (modelInfo) {
    content = (
      <div className={`entity-details entity-details__${entityType}`}>
        <Outlet />
      </div>
    );
  } else if (modelsLoaded && !modelUUID) {
    content = (
      <div className="p-strip">
        <div className="row">
          <NotFound message={Label.NOT_FOUND}>
            <>
              <p>
                Could not find a model named "{modelName}" for the user "
                {userName}
                ". If this is a model that belongs to another user then check
                that you have been{" "}
                <a href="https://juju.is/docs/olm/manage-users#heading--model-access">
                  granted access
                </a>
                .
              </p>
              <p>
                <Link to={urls.models.index}>View all models</Link>
              </p>
            </>
          </NotFound>
        </div>
      </div>
    );
  } else {
    content = <LoadingSpinner />;
  }

  return (
    <BaseLayout
      data-testid={TestId.COMPONENT}
      status={
        showWebCLI &&
        controllerWSHost && (
          <WebCLI
            controllerWSHost={controllerWSHost}
            credentials={credentials}
            modelUUID={modelUUID}
            protocol={wsProtocol ?? "wss"}
          />
        )
      }
      title={
        <>
          <Breadcrumb />
          <div
            className="entity-details__view-selector"
            data-testid="view-selector"
          >
            {modelInfo && entityType === "model" && (
              <Tabs links={generateTabItems()} />
            )}
          </div>
        </>
      }
      titleClassName={classNames("entity-details__header", {
        "entity-details__header--single-col": isNestedEntityPage,
      })}
      titleComponent="div"
    >
      {modelWatcherError ? (
        <Strip className="u-no-padding--bottom" shallow>
          <Notification
            className="u-no-margin--bottom"
            severity="negative"
            title="Error"
          >
            {modelWatcherError === "timeout" ? (
              <span>{Label.MODEL_WATCHER_TIMEOUT}</span>
            ) : (
              <span>{Label.MODEL_WATCHER_ERROR}</span>
            )}
            {modelWatcherError && modelWatcherError !== "timeout" ? (
              <span>{` ${modelWatcherError}`}</span>
            ) : null}{" "}
            <Button appearance="link" onClick={() => window.location.reload()}>
              Refresh
            </Button>
            {"."}
          </Notification>
        </Strip>
      ) : null}
      {content}
    </BaseLayout>
  );
};

export default EntityDetails;
