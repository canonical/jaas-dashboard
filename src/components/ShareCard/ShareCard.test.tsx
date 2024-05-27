import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import ShareCard, { Label } from "./ShareCard";

describe("Share Card", () => {
  it("should display appropriate text", () => {
    render(
      <ShareCard
        userName="janedoe"
        lastConnected="2021-06-03T16:03:15Z"
        access="read"
        isOwner={false}
        removeUser={vi.fn()}
        accessSelectChange={vi.fn()}
      />,
    );
    expect(screen.getAllByText("janedoe")[0]).toHaveClass(
      "share-card__username",
    );
    const remove = screen.getByRole("button", { name: Label.REMOVE });
    expect(remove).toBeInTheDocument();
  });

  it("should not allow owners to change access", () => {
    render(
      <ShareCard
        userName="janedoe"
        lastConnected="2021-06-03T16:03:15Z"
        access="read"
        isOwner={true}
        removeUser={vi.fn()}
        accessSelectChange={vi.fn()}
      />,
    );
    expect(screen.getByText(Label.OWNER)).toHaveClass("share-card__secondary");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText(Label.REMOVE)).not.toBeInTheDocument();
  });

  it("should call remove function when icon clicked", async () => {
    const removeUserFn = vi.fn();
    const accessSelectChangeFn = vi.fn();
    render(
      <ShareCard
        userName="janedoe"
        lastConnected="2021-06-03T16:03:15Z"
        access="read"
        isOwner={false}
        removeUser={removeUserFn}
        accessSelectChange={accessSelectChangeFn}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: Label.REMOVE }));
    expect(removeUserFn).toHaveBeenCalled();
  });

  it("should call access change function when select value clicked", async () => {
    const removeUserFn = vi.fn();
    const accessSelectChangeFn = vi.fn(() => Promise.resolve(null));
    render(
      <ShareCard
        userName="janedoe"
        lastConnected="2021-06-03T16:03:15Z"
        access="read"
        isOwner={false}
        removeUser={removeUserFn}
        accessSelectChange={accessSelectChangeFn}
      />,
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "write");
    expect(accessSelectChangeFn).toHaveBeenCalled();
  });

  it("should display console error when trying to change access", async () => {
    const consoleError = console.error;
    console.error = vi.fn();

    const removeUserFn = vi.fn();
    const accessSelectChangeFn = vi.fn(() => Promise.reject(new Error()));
    render(
      <ShareCard
        userName="janedoe"
        lastConnected="2021-06-03T16:03:15Z"
        access="read"
        isOwner={false}
        removeUser={removeUserFn}
        accessSelectChange={accessSelectChangeFn}
      />,
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "write");
    expect(console.error).toHaveBeenCalledWith(
      Label.ACCESS_CHANGE_ERROR,
      new Error(),
    );

    console.error = consoleError;
  });
});
