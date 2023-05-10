import { act, render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import cloneDeep from "clone-deep";
import { Toaster } from "react-hot-toast";
import reactHotToast from "react-hot-toast";

import ToastCard from "./ToastCard";

describe("Toast Card", () => {
  const toastInstanceExample = {
    createdAt: 1623162274616,
    duration: 5000,
    id: "2",
    message: "message",
    pauseDuration: 0,
    style: {},
    type: "custom",
    visible: true,
  };

  it("should display message", () => {
    const t = cloneDeep(toastInstanceExample);
    render(
      <ToastCard
        type="positive"
        text="I am a toast message"
        toastInstance={t}
      />
    );
    expect(screen.getByText("I am a toast message")).toHaveClass(
      "toast-card__message"
    );
  });

  it("should display as correct type", () => {
    const t = cloneDeep(toastInstanceExample);
    const { container } = render(
      <ToastCard
        type="positive"
        text="I am a toast message"
        toastInstance={t}
      />
    );
    expect(container.firstChild).toHaveAttribute("data-type", "positive");
  });

  it("should display correct success icon", () => {
    const t = cloneDeep(toastInstanceExample);
    render(
      <ToastCard
        type="positive"
        text="I am a toast message"
        toastInstance={t}
      />
    );
    expect(document.querySelector(".p-icon--success")).toBeInTheDocument();
  });

  it("should display correct error icon", () => {
    const t = cloneDeep(toastInstanceExample);
    render(
      <ToastCard
        type="negative"
        text="I am a toast message"
        toastInstance={t}
      />
    );
    expect(document.querySelector(".p-icon--error")).toBeInTheDocument();
  });

  it("should display correct warning icon", () => {
    const t = cloneDeep(toastInstanceExample);
    render(
      <ToastCard type="caution" text="I am a toast message" toastInstance={t} />
    );
    expect(document.querySelector(".p-icon--warning")).toBeInTheDocument();
  });

  it("should display close icon", () => {
    const t = cloneDeep(toastInstanceExample);
    render(
      <ToastCard
        type="negative"
        text="I am a toast message"
        toastInstance={t}
      />
    );
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass(
      "p-icon--close"
    );
  });

  it("should not display an undo button if an undo function is not passed", () => {
    const t = cloneDeep(toastInstanceExample);
    render(
      <ToastCard
        type="negative"
        text="I am a toast message"
        toastInstance={t}
      />
    );
    expect(
      screen.queryByRole("button", { name: "Undo" })
    ).not.toBeInTheDocument();
  });

  it("should display a clickable undo button if an undo function is passed", async () => {
    const undoFn = jest.fn();
    const t = cloneDeep(toastInstanceExample);
    render(
      <ToastCard
        type="negative"
        text="I am a toast message"
        toastInstance={t}
        undo={undoFn}
      />
    );
    const undoButton = screen.getByRole("button", { name: "Undo" });
    expect(undoButton).toBeInTheDocument();
    await userEvent.click(undoButton);
    expect(undoFn).toHaveBeenCalled();
  });

  it("should remove the card when close is clicked", async () => {
    render(<Toaster />);
    await act(async () => {
      reactHotToast.custom((t) => (
        <ToastCard
          type="negative"
          text="I am a toast message"
          toastInstance={t}
        />
      ));
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should close the card using the keyboard", async () => {
    render(<Toaster />);
    await act(async () => {
      reactHotToast.custom((t) => (
        <ToastCard
          type="negative"
          text="I am a toast message"
          toastInstance={t}
        />
      ));
    });
    expect(screen.getByRole("status")).toBeInTheDocument();
    fireEvent.keyUp(screen.getByRole("button", { name: "Close" }), {
      key: " ",
      code: "Space",
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
