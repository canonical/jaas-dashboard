import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { RootState } from "store/store";
import { jujuStateFactory, rootStateFactory } from "testing/factories";
import { generalStateFactory, configFactory } from "testing/factories/general";
import { modelListInfoFactory } from "testing/factories/juju/juju";
import { renderComponent } from "testing/utils";

import ErrorsBlock from "./ErrorsBlock";

describe("ErrorsBlock", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory.withGeneralConfig().build({
      general: generalStateFactory.build({
        controllerConnections: {
          "wss://controller.example.com": { controllerTag: "controller" },
        },
        config: configFactory.build({
          controllerAPIEndpoint: "wss://controller.example.com",
        }),
      }),
      juju: jujuStateFactory.build({
        models: {
          abc123: modelListInfoFactory.build({
            uuid: "abc123",
            name: "test-model",
            ownerTag: "user-eggman@external",
          }),
        },
      }),
    });
  });

  it("should render null when cross-model query is loading", () => {
    state.juju.crossModelQuery.loading = true;
    renderComponent(<ErrorsBlock />, { state });
    expect(screen.queryByText("Error:")).toBeNull();
    expect(screen.queryByText("Errors")).toBeNull();
  });

  it("should render null when there is no error", () => {
    state.juju.crossModelQuery.errors = null;
    renderComponent(<ErrorsBlock />, { state });
    expect(screen.queryByText("Error:")).toBeNull();
    expect(screen.queryByText("Errors")).toBeNull();
  });

  it("should render string error", () => {
    state.juju.crossModelQuery.errors = "mockError";
    renderComponent(<ErrorsBlock />, { state });
    expect(screen.getByText("Error:")).toBeVisible();
    expect(screen.queryByText("Errors")).toBeNull();
    expect(screen.getByText("mockError")).toBeVisible();
  });

  it("should render error that is the same for all models", () => {
    state.juju.crossModelQuery.errors = {
      model0: ["mockError1", "mockError2"],
      model1: ["mockError2", "mockError1"],
    };
    renderComponent(<ErrorsBlock />, { state });
    expect(screen.getByText("Error:")).toBeVisible();
    expect(screen.queryByText("Errors")).toBeNull();
    expect(screen.getByText("mockError1")).toBeVisible();
    expect(screen.getByText("mockError2")).toBeVisible();
  });

  it("should render errors in json format", async () => {
    state.juju.crossModelQuery.errors = {
      abc123: ["mockError0"],
      model1: ["mockError1"],
    };
    renderComponent(<ErrorsBlock />, { state });
    expect(screen.queryByText("Error:")).toBeNull();
    expect(screen.getByText("Errors")).toBeVisible();
    const codeSnippetDropdownButton = screen.getByRole("combobox");
    expect(codeSnippetDropdownButton).toBeVisible();
    expect(
      screen.getByRole("option", { name: "Tree", hidden: true })
    ).toHaveAttribute("value", "tree");
    expect(
      screen.getByRole("option", { name: "JSON", hidden: true })
    ).toHaveAttribute("value", "json");
    await userEvent.selectOptions(codeSnippetDropdownButton, "JSON");
    expect(screen.getByText('"abc123"')).toBeVisible();
    expect(screen.getByText('"mockError0"')).toBeVisible();
    expect(screen.getByText('"model1"')).toBeVisible();
    expect(screen.getByText('"mockError1"')).toBeVisible();
  });

  it("should render errors in tree format", async () => {
    state.juju.crossModelQuery.errors = {
      abc123: ["mockError0"],
      model1: ["mockError1"],
    };
    renderComponent(<ErrorsBlock />, { state });
    const codeSnippetDropdownButton = screen.getByRole("combobox");
    await userEvent.selectOptions(codeSnippetDropdownButton, "Tree");
    expect(document.querySelector(".p-code-snippet__block")).toHaveTextContent(
      '▶eggman@external/test-model[] 1 item0:"mockError0"▶:[] 1 item0:"mockError1"'
    );
  });
});
