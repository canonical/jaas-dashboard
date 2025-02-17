import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX } from "react";
import { vi } from "vitest";

import { usePanelQueryParams } from "panels/hooks";
import { renderComponent } from "testing/utils";

import Panel from "./Panel";

describe("Panel", () => {
  const mockCheckCanClose = () => false;
  const mockRenderComponent = ({
    checkCanClose,
  }: {
    checkCanClose?: (
      e: KeyboardEvent | React.MouseEvent<Element, MouseEvent>,
    ) => boolean;
  }) => {
    const MockPanelHeader = (): JSX.Element => {
      const [, , handleRemovePanelQueryParams] = usePanelQueryParams<{
        panel: null | string;
      }>({ panel: null });

      return (
        <Panel
          checkCanClose={checkCanClose}
          panelClassName="test-panel"
          title="Test panel"
          onRemovePanelQueryParams={handleRemovePanelQueryParams}
        >
          <>Test content</>
        </Panel>
      );
    };

    return renderComponent(<MockPanelHeader />, {
      url: "/foo?panel=share-model&externalParam=externalValue",
    });
  };

  it("should display the title and content", async () => {
    mockRenderComponent({});

    expect(screen.getByText("Test panel")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should give the panel a class name", async () => {
    mockRenderComponent({});

    expect(document.querySelector(".p-panel")).toHaveClass("test-panel");
  });

  it("can display split columns", async () => {
    render(
      <Panel
        onRemovePanelQueryParams={vi.fn()}
        isSplit
        title="Test panel"
        splitContent={<div className="split-content"></div>}
      >
        Test content
      </Panel>,
    );
    expect(document.querySelector(".p-panel__content")).toHaveClass(
      "aside-split-wrapper",
    );
    // It should wrap the left content in a column:
    expect(
      document.querySelector(".aside-split-col .side-panel__content-scrolling"),
    ).toBeInTheDocument();
    // It should wrap the right content in a column:
    expect(
      document.querySelector(".aside-split-col .split-content"),
    ).toBeInTheDocument();
  });

  it("can display a button drawer", async () => {
    render(
      <Panel
        onRemovePanelQueryParams={vi.fn()}
        title="Test panel"
        drawer={<button>Open!</button>}
      >
        Test content
      </Panel>,
    );
    // It should wrap the left content in a column:
    const button = screen.getByRole("button", { name: "Open!" });
    expect(button).toBeInTheDocument();
    expect(button.parentElement).toHaveClass("side-panel__drawer");
  });

  it("should clear only the panel params when escape key is pressed", async () => {
    const { router } = mockRenderComponent({});

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe(
      "?panel=share-model&externalParam=externalValue",
    );

    await userEvent.type(window.document.documentElement, "{Escape}", {
      skipClick: true,
    });

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe("?externalParam=externalValue");
  });

  it("should not close if another key is pressed", async () => {
    const { router } = mockRenderComponent({});

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe(
      "?panel=share-model&externalParam=externalValue",
    );

    await userEvent.type(window.document.documentElement, "{Enter}", {
      skipClick: true,
    });

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe(
      "?panel=share-model&externalParam=externalValue",
    );
  });

  it("should check if it can close when escape key is pressed", async () => {
    const { router } = mockRenderComponent({
      checkCanClose: mockCheckCanClose,
    });

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe(
      "?panel=share-model&externalParam=externalValue",
    );

    await userEvent.type(window.document.documentElement, "{Escape}", {
      skipClick: true,
    });

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe(
      "?panel=share-model&externalParam=externalValue",
    );
  });

  it("should only clear the panel params when clicking outside the panel", async () => {
    const { router } = mockRenderComponent({});

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe(
      "?panel=share-model&externalParam=externalValue",
    );

    await userEvent.click(window.document.documentElement);

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe("?externalParam=externalValue");
  });

  it("should not clear the search params when clicking inside the panel", async () => {
    const { router } = mockRenderComponent({});

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe(
      "?panel=share-model&externalParam=externalValue",
    );

    await userEvent.click(screen.getByText("Test content"));

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe(
      "?panel=share-model&externalParam=externalValue",
    );
  });

  it("should check if it can close when clicking outside the panel", async () => {
    const { router } = mockRenderComponent({
      checkCanClose: mockCheckCanClose,
    });

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe(
      "?panel=share-model&externalParam=externalValue",
    );

    await userEvent.click(window.document.documentElement);

    expect(router.state.location.pathname).toBe("/foo");
    expect(router.state.location.search).toBe(
      "?panel=share-model&externalParam=externalValue",
    );
  });
});
