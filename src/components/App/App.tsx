import ReactGA from "react-ga4";

import ConnectionError from "components/ConnectionError";
import ErrorBoundary from "components/ErrorBoundary";
import Routes from "components/Routes";
import { getAnalyticsEnabled } from "store/general/selectors";
import { useAppSelector } from "store/store";

import "../../scss/index.scss";

function App() {
  const isProduction = import.meta.env.PROD;
  const analyticsEnabled = useAppSelector(getAnalyticsEnabled);
  if (isProduction && analyticsEnabled) {
    ReactGA.initialize("G-JHXHM8VXJ1", {
      gtagOptions: {
        custom_map: {
          dimension1: "dashboardVersion",
          dimension2: "controllerVersion",
          dimension3: "isJuju",
        },
      },
    });
    ReactGA.send({
      hitType: "pageview",
      page: window.location.href.replace(window.location.origin, ""),
    });
  }

  return (
    <ErrorBoundary>
      <ConnectionError>
        <Routes />
      </ConnectionError>
    </ErrorBoundary>
  );
}

export default App;
