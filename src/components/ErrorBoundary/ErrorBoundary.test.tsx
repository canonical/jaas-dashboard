import { render } from "@testing-library/react";
import type { MockInstance } from "vitest";
import { vi } from "vitest";

import ErrorBoundary from "./ErrorBoundary";

function ChildComponent() {
  const error = new Error("Oh noes!");
  error.stack = "Stack trace output";
  throw error;
  return null;
}

describe("Error Boundary", () => {
  let consoleError: MockInstance;

  beforeEach(() => {
    // Vitest does not catch the error thrown in the component so this cleans up
    // the console output.
    consoleError = vi.spyOn(console, "error").mockImplementation(() => vi.fn());
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("renders without crashing and matches snapshot", () => {
    const { container } = render(
      <ErrorBoundary>
        <ChildComponent />
      </ErrorBoundary>,
    );
    expect(container).toMatchSnapshot();
  });
});
