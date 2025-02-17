import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { RootState } from "store/store";
import { configFactory, generalStateFactory } from "testing/factories/general";
import { rootStateFactory } from "testing/factories/root";
import { renderComponent } from "testing/utils";
import { rebacURLS } from "urls";

import AccessButton from "./AccessButton";

const iconClass = ".p-icon--share";

describe("AccessButton", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory.build({
      general: generalStateFactory.withConfig().build({
        config: configFactory.build({
          isJuju: true,
        }),
      }),
    });
  });

  it("displays an access button with an icon", () => {
    renderComponent(
      <AccessButton displayIcon modelName="test-model">
        Access
      </AccessButton>,
      { state },
    );
    expect(document.querySelector(iconClass)).toBeInTheDocument();
  });

  it("displays an access button without an icon", () => {
    renderComponent(
      <AccessButton modelName="test-model">Access</AccessButton>,
      { state },
    );
    expect(document.querySelector(iconClass)).not.toBeInTheDocument();
  });

  it("can open the access panel with a model name", async () => {
    const { router } = renderComponent(
      <AccessButton modelName="test-model">Access</AccessButton>,
      { state },
    );
    await userEvent.click(screen.getByRole("button", { name: "Access" }));
    expect(router?.state.location.search).toBe(
      "?model=test-model&panel=share-model",
    );
  });

  it("can open the access panel without a model name", async () => {
    const { router } = renderComponent(<AccessButton>Access</AccessButton>, {
      state,
    });
    await userEvent.click(screen.getByRole("button", { name: "Access" }));
    expect(router?.state.location.search).toBe("?panel=share-model");
  });

  it("links to permissions when using JAAS", async () => {
    state = rootStateFactory.build({
      general: generalStateFactory.withConfig().build({
        config: configFactory.build({
          isJuju: false,
        }),
      }),
    });
    renderComponent(
      <AccessButton modelName="test-model">Access</AccessButton>,
      { state },
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      rebacURLS.groups.index,
    );
  });
});
