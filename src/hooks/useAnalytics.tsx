import ReactGA from "react-ga4";

import { getAnalyticsEnabled } from "store/general/selectors";
import { useAppSelector } from "store/store";

type AnalyticMessage = {
  path?: string;
  category?: string;
  action?: string;
  eventParams?: { [key: string]: string };
};

export default function useAnalytics() {
  const analyticsEnabled = useAppSelector(getAnalyticsEnabled);
  return ({
    path,
    category = "",
    action = "",
    eventParams = {},
  }: AnalyticMessage) => {
    const isProduction = import.meta.env.PROD;
    if (!isProduction || !analyticsEnabled) {
      return;
    }
    if (path) {
      ReactGA.send({ hitType: "page_view", page: path });
    } else {
      ReactGA.event({
        category,
        action,
        ...eventParams,
      });
    }
  };
}
