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
    ReactGA.initialize("UA-1018242-68"); // TODO: should use the GA4 Measurement ID (which starts with "G-")
    ReactGA.send({
      hitType: "page_view",
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
