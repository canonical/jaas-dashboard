import ReactGA from "react-ga4";
import { useSelector } from "react-redux";

import {
  getAnalyticsEnabled,
  getAppVersion,
  getControllerConnection,
  getIsJuju,
  getWSControllerURL,
} from "store/general/selectors";
import { useAppSelector } from "store/store";

type AnalyticMessage = {
  path?: string;
  category?: string;
  action?: string;
};

export default function useAnalytics() {
  const analyticsEnabled = useAppSelector(getAnalyticsEnabled);
  const isJuju = useSelector(getIsJuju);
  const appVersion = useSelector(getAppVersion);
  const wsControllerURL = useAppSelector(getWSControllerURL);
  const controllerVersion = useAppSelector((state) =>
    getControllerConnection(state, wsControllerURL),
  )?.serverVersion;

  return ({ path, category = "", action = "" }: AnalyticMessage) => {
    const isProduction = import.meta.env.PROD;
    if (!isProduction || !analyticsEnabled) {
      return;
    }
    if (path) {
      ReactGA.send({ hitType: "pageview", page: path });
    } else {
      ReactGA.set({
        user_properties: {
          dashboardVersion: appVersion ?? "",
          controllerVersion: controllerVersion ?? "",
          isJuju: (!!isJuju).toString(),
        },
      });
      ReactGA.event({
        category,
        action,
      });
    }
  };
}
