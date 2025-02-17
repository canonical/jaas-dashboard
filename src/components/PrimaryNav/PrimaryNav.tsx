import { dashboardUpdateAvailable } from "@canonical/jujulib/dist/api/versions";
import {
  Icon,
  StatusLabel,
  Tooltip,
  SideNavigation,
  SideNavigationText,
} from "@canonical/react-components";
import type { NavItem } from "@canonical/react-components/dist/components/SideNavigation/SideNavigation";
import type { HTMLProps, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { NavLinkProps } from "react-router";
import { NavLink } from "react-router";

import UserMenu from "components/UserMenu/UserMenu";
import { DARK_THEME } from "consts";
import {
  useAuditLogsPermitted,
  useIsJIMMAdmin,
} from "juju/api-hooks/permissions";
import {
  getAppVersion,
  isCrossModelQueriesEnabled,
  getVisitURLs,
  isReBACEnabled,
} from "store/general/selectors";
import {
  getControllerData,
  getGroupedModelStatusCounts,
} from "store/juju/selectors";
import type { Controllers } from "store/juju/types";
import { useAppSelector } from "store/store";
import urls, { externalURLs, rebacURLS } from "urls";

import "./_primary-nav.scss";

import { Label } from "./types";

const useControllersLink = () => {
  const controllers: Controllers | null = useSelector(getControllerData);
  const authenticationRequired =
    (useAppSelector(getVisitURLs)?.length ?? 0) > 0;

  const controllersUpdateCount = useMemo(() => {
    if (!controllers) {
      return 0;
    }
    return Object.values(controllers).reduce(
      (controllersCount, controllerArray) =>
        controllersCount +
        controllerArray.reduce(
          (count, controller) =>
            "version" in controller && controller.updateAvailable
              ? count + 1
              : count,
          0,
        ),
      0,
    );
  }, [controllers]);

  let status: ReactNode = null;
  if (authenticationRequired) {
    status = (
      <span className="entity-count">
        <Icon name="lock-locked" light title="Authentication required" />
      </span>
    );
  } else if (controllersUpdateCount > 0) {
    status = (
      <span className="entity-count is-caution">{controllersUpdateCount}</span>
    );
  }

  return {
    component: NavLink,
    to: urls.controllers,
    icon: "controllers",
    label: "Controllers",
    status,
  };
};

const PrimaryNav = () => {
  const appVersion = useSelector(getAppVersion);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const versionRequested = useRef(false);
  const crossModelQueriesEnabled = useAppSelector(isCrossModelQueriesEnabled);
  const rebacEnabled = useAppSelector(isReBACEnabled);
  const { blocked: blockedModels } = useSelector(getGroupedModelStatusCounts);
  const { permitted: isJIMMControllerAdmin } = useIsJIMMAdmin();
  const { permitted: auditLogsAllowed } = useAuditLogsPermitted();
  const controllersLink = useControllersLink();
  const rebacAllowed = rebacEnabled && isJIMMControllerAdmin;

  useEffect(() => {
    if (appVersion && !versionRequested.current) {
      dashboardUpdateAvailable(appVersion || "")
        .then((updateAvailable) => setUpdateAvailable(updateAvailable ?? false))
        .catch(() => setUpdateAvailable(false));
      versionRequested.current = true;
    }
  }, [appVersion]);

  const navigation: NavItem<NavLinkProps>[] = [
    {
      component: NavLink,
      to: urls.models.index,
      icon: "models",
      label: "Models",
      status: blockedModels > 0 && (
        <span className="entity-count is-negative">{blockedModels}</span>
      ),
    },
    controllersLink,
  ];
  if (auditLogsAllowed) {
    navigation.push({
      component: NavLink,
      to: urls.logs,
      icon: "topic",
      label: <>{Label.LOGS}</>,
    });
  }
  if (crossModelQueriesEnabled) {
    navigation.push({
      component: NavLink,
      to: urls.search,
      icon: "search",
      label: <>{Label.ADVANCED_SEARCH}</>,
    });
  }
  if (rebacAllowed) {
    navigation.push({
      component: NavLink,
      icon: "user",
      label: <>{Label.PERMISSIONS}</>,
      to: rebacURLS.users.index,
    });
  }

  const extraNav = [
    {
      href: externalURLs.newIssue,
      label: "Report a bug",
      target: "_blank",
      rel: "noopener noreferrer",
    },
    <SideNavigationText
      key="version"
      status={
        updateAvailable ? (
          <Tooltip message="A new version of the dashboard is available.">
            <Icon name="warning" data-testid="dashboard-update" />
          </Tooltip>
        ) : (
          <StatusLabel appearance="positive">Beta</StatusLabel>
        )
      }
    >
      <span className="version">Version {appVersion}</span>
    </SideNavigationText>,
  ];

  return (
    <>
      <SideNavigation<NavLinkProps | HTMLProps<HTMLAnchorElement>>
        dark={DARK_THEME}
        items={[{ items: navigation }, { items: extraNav }]}
        className="p-primary-nav"
      />
      <UserMenu />
    </>
  );
};

export default PrimaryNav;
