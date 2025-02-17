import type { TabsProps } from "@canonical/react-components";
import { Tabs } from "@canonical/react-components";
import type { MouseEvent } from "react";
import { useSelector } from "react-redux";
import type { LinkProps } from "react-router";
import { useParams, Link } from "react-router";

import type { EntityDetailsRoute } from "components/Routes";
import { useQueryParams } from "hooks/useQueryParams";
import { useAuditLogsPermitted } from "juju/api-hooks/permissions";
import {
  isKubernetesModel,
  getCanListSecrets,
  getModelUUIDFromList,
} from "store/juju/selectors";
import { useAppSelector } from "store/store";
import urls from "urls";
import { ModelTab } from "urls";

import { Label } from "./types";

const ModelTabs = () => {
  const { userName, modelName } = useParams<EntityDetailsRoute>();
  const modelUUID = useSelector(getModelUUIDFromList(modelName, userName));
  const isK8s = useAppSelector((state) => isKubernetesModel(state, modelUUID));
  const canListSecrets = useAppSelector((state) =>
    getCanListSecrets(state, modelUUID),
  );
  const { permitted: auditLogsAllowed } = useAuditLogsPermitted();
  const [query] = useQueryParams({
    panel: null,
    entity: null,
    activeView: "apps",
    filterQuery: "",
  });
  const { activeView } = query;

  const handleNavClick = (e: MouseEvent) => {
    (e.target as HTMLAnchorElement)?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  };

  const tabs: TabsProps<LinkProps>["links"] = [];
  if (userName && modelName) {
    tabs.push(
      {
        active: activeView === ModelTab.APPS,
        label: Label.APPLICATIONS,
        onClick: (e: MouseEvent) => handleNavClick(e),
        to: urls.model.tab({ userName, modelName, tab: ModelTab.APPS }),
        component: Link,
      },
      {
        active: activeView === ModelTab.INTEGRATIONS,
        label: Label.INTEGRATIONS,
        onClick: (e: MouseEvent) => handleNavClick(e),
        to: urls.model.tab({ userName, modelName, tab: ModelTab.INTEGRATIONS }),
        component: Link,
      },
      {
        active: activeView === "logs",
        label: auditLogsAllowed ? Label.LOGS : Label.ACTION_LOGS,
        onClick: (e: MouseEvent) => handleNavClick(e),
        to: urls.model.tab({ userName, modelName, tab: ModelTab.LOGS }),
        component: Link,
      },
    );

    if (canListSecrets) {
      tabs.push({
        active: activeView === "secrets",
        label: Label.SECRETS,
        onClick: (e: MouseEvent) => handleNavClick(e),
        to: urls.model.tab({ userName, modelName, tab: ModelTab.SECRETS }),
        component: Link,
      });
    }

    if (!isK8s) {
      tabs.push({
        active: activeView === ModelTab.MACHINES,
        label: Label.MACHINES,
        onClick: (e: MouseEvent) => handleNavClick(e),
        to: urls.model.tab({ userName, modelName, tab: ModelTab.MACHINES }),
        component: Link,
      });
    }
  }

  return <Tabs links={tabs} />;
};

export default ModelTabs;
