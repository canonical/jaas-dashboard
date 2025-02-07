import ReactGA from "react-ga4";
import { BrowserRouter, Route, Routes } from "react-router";
import type { MockInstance } from "vitest";
import { vi } from "vitest";

import type { RootState } from "store/store";
import { configFactory, generalStateFactory } from "testing/factories/general";
import { rootStateFactory } from "testing/factories/root";
import { renderComponent } from "testing/utils";
import { changeURL } from "testing/utils";

import CaptureRoutes from "./CaptureRoutes";

describe("CaptureRoutes", () => {
  let pageviewSpy: MockInstance;
  let state: RootState;

  beforeEach(() => {
    vi.stubEnv("PROD", true);
    pageviewSpy = vi.spyOn(ReactGA, "send");
    state = rootStateFactory.build({
      general: generalStateFactory.build({
        config: configFactory.build({
          analyticsEnabled: true,
        }),
      }),
    });
  });

  it("sends path change events", async () => {
    const {
      result: { rerender },
    } = renderComponent(<CaptureRoutes />, {
      path: "*",
      state,
    });
    changeURL("/new/path");
    // Force the component to rerender so the useEffect runs.
    rerender(
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<CaptureRoutes />} />
        </Routes>
      </BrowserRouter>,
    );
    expect(pageviewSpy).toHaveBeenCalledWith({
      hitType: "pageview",
      page: "/new/path",
    });
  });
});
