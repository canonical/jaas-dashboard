import { screen } from "@testing-library/react";

import { configFactory, generalStateFactory } from "testing/factories/general";
import { rootStateFactory } from "testing/factories/root";
import { renderComponent } from "testing/utils";

import AccessButton from "./AccessButton";
import { Label } from "./types";

describe("AccessButton", () => {
  it("displays an access button", () => {
    const state = rootStateFactory.build({
      general: generalStateFactory.withConfig().build({
        config: configFactory.build({
          isJuju: true,
        }),
      }),
    });
    renderComponent(<AccessButton modelName="test-model" />, { state });
    expect(
      screen.getByRole("button", { name: Label.ACCESS_BUTTON }),
    ).toBeInTheDocument();
  });
});
