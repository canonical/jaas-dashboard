import ReactGA from "react-ga4";
import type { MockInstance } from "vitest";
import { vi } from "vitest";

import { rootStateFactory } from "testing/factories";
import { configFactory, generalStateFactory } from "testing/factories/general";
import { renderWrappedHook } from "testing/utils";

import useAnalytics from "./useAnalytics";

vi.mock("react-ga4", () => ({
  default: {
    initialize: vi.fn(),
    send: vi.fn(),
    event: vi.fn(),
    set: vi.fn(),
  },
}));

describe("useAnalytics", () => {
  let pageviewSpy: MockInstance;
  let eventSpy: MockInstance;
  let setSpy: MockInstance;

  beforeEach(() => {
    vi.stubEnv("PROD", true);
    eventSpy = vi.spyOn(ReactGA, "event");
    pageviewSpy = vi.spyOn(ReactGA, "send");
    setSpy = vi.spyOn(ReactGA, "set");
  });

  afterEach(() => {
    localStorage.clear();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("does not send events in development", () => {
    vi.stubEnv("PROD", false);
    const { result } = renderWrappedHook(() => useAnalytics(), {
      state: rootStateFactory.build({
        general: generalStateFactory.build({
          config: configFactory.build({
            analyticsEnabled: true,
          }),
        }),
      }),
    });
    result.current({ path: "/some/path" });
    expect(eventSpy).not.toHaveBeenCalled();
    expect(pageviewSpy).not.toHaveBeenCalled();
  });

  it("does not send events if analytics are disabled", () => {
    const { result } = renderWrappedHook(() => useAnalytics(), {
      state: rootStateFactory.build({
        general: generalStateFactory.build({
          config: configFactory.build({
            analyticsEnabled: false,
          }),
        }),
      }),
    });
    result.current({ path: "/some/path" });
    expect(eventSpy).not.toHaveBeenCalled();
    expect(pageviewSpy).not.toHaveBeenCalled();
  });

  it("can send pageview events", () => {
    const { result } = renderWrappedHook(() => useAnalytics(), {
      state: rootStateFactory.build({
        general: generalStateFactory.build({
          config: configFactory.build({
            analyticsEnabled: true,
          }),
        }),
      }),
    });
    result.current({ path: "/some/path" });
    expect(pageviewSpy).toHaveBeenCalledWith({
      hitType: "pageview",
      page: "/some/path",
    });
  });

  it("can send events", () => {
    const { result } = renderWrappedHook(() => useAnalytics(), {
      state: rootStateFactory.build({
        general: generalStateFactory.build({
          config: configFactory.build({
            analyticsEnabled: true,
          }),
        }),
      }),
    });
    result.current({ category: "sidebar", action: "toggle" });
    expect(eventSpy).toHaveBeenCalledWith({
      category: "sidebar",
      action: "toggle",
    });
    expect(setSpy).toHaveBeenCalledWith({
      user_properties: {
        controllerVersion: "",
        dashboardVersion: "",
        isJuju: "false",
      },
    });
  });
});
