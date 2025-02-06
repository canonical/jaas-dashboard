import { renderHook } from "@testing-library/react";
import ReactGA from "react-ga4";
import type { MockInstance } from "vitest";
import { vi } from "vitest";

import * as store from "store/store";

import useAnalytics from "./useAnalytics";

vi.mock("react-ga4", () => ({
  default: {
    initialize: vi.fn(),
    send: vi.fn(),
    event: vi.fn(),
  },
}));

describe("useAnalytics", () => {
  let pageviewSpy: MockInstance;
  let eventSpy: MockInstance;

  beforeEach(() => {
    vi.stubEnv("PROD", true);
    eventSpy = vi.spyOn(ReactGA, "event");
    pageviewSpy = vi.spyOn(ReactGA, "send");
  });

  afterEach(() => {
    localStorage.clear();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("does not send events in development", () => {
    vi.spyOn(store, "useAppSelector").mockImplementation(
      vi.fn().mockReturnValue(true),
    );
    vi.stubEnv("PROD", false);
    const { result } = renderHook(() => useAnalytics());
    result.current({ path: "/some/path" });
    expect(eventSpy).not.toHaveBeenCalled();
    expect(pageviewSpy).not.toHaveBeenCalled();
  });

  it("does not send events if analytics are disabled", () => {
    vi.spyOn(store, "useAppSelector").mockImplementation(
      vi.fn().mockReturnValue(false),
    );
    const { result } = renderHook(() => useAnalytics());
    result.current({ path: "/some/path" });
    expect(eventSpy).not.toHaveBeenCalled();
    expect(pageviewSpy).not.toHaveBeenCalled();
  });

  it("can send pageview events", () => {
    vi.spyOn(store, "useAppSelector").mockImplementation(
      vi.fn().mockReturnValue(true),
    );
    const { result } = renderHook(() => useAnalytics());
    result.current({ path: "/some/path" });
    expect(pageviewSpy).toHaveBeenCalledWith({
      hitType: "page_view",
      page: "/some/path",
    });
  });

  it("can send events", () => {
    vi.spyOn(store, "useAppSelector").mockImplementation(
      vi.fn().mockReturnValue(true),
    );
    const { result } = renderHook(() => useAnalytics());
    result.current({ category: "sidebar", action: "toggle" });
    expect(eventSpy).toHaveBeenCalledWith({
      category: "sidebar",
      action: "toggle",
    });
  });
});
