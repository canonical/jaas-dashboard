import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { vi } from "vitest";

import RelativeDate from "./RelativeDate";

describe("RelativeDate", () => {
  const yesterday = new Date(Date.now() - 60 * 1000 * 60 * 24);
  let userEventWithTimers: UserEvent;

  beforeEach(() => {
    vi.useFakeTimers();
    userEventWithTimers = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("displays a relative date", async () => {
    render(<RelativeDate datetime={yesterday.toISOString()} />);
    expect(screen.getByText("1 day ago")).toBeInTheDocument();
  });

  it("displays the tooltip if the content is truncated", async () => {
    render(<RelativeDate datetime={yesterday.toISOString()} />);
    const fullDate = yesterday.toLocaleString();
    expect(screen.queryByText(fullDate)).not.toBeInTheDocument();
    await act(async () => {
      await userEventWithTimers.hover(screen.getByText("1 day ago"));
      vi.runAllTimers();
    });
    expect(screen.getByText(fullDate)).toBeInTheDocument();
  });
});
