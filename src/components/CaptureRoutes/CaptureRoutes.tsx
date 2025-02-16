import type { JSX } from "react";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

import useAnalytics from "hooks/useAnalytics";

const CaptureRoutes = (): JSX.Element => {
  const sendAnalytics = useAnalytics();
  const location = useLocation();

  useEffect(() => {
    // Send an analytics event when the URL changes.
    sendAnalytics({
      path: window.location.href.replace(window.location.origin, ""),
    });
  }, [location, sendAnalytics]);

  return <Outlet />;
};

export default CaptureRoutes;
