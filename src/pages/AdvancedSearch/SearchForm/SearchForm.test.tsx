import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as componentUtils from "components/utils";
import { actions as jujuActions } from "store/juju";
import type { RootState } from "store/store";
import { rootStateFactory } from "testing/factories";
import { generalStateFactory, configFactory } from "testing/factories/general";
import { crossModelQueryFactory } from "testing/factories/juju/jimm";
import { renderComponent } from "testing/utils";

import SearchForm, { Label } from "./SearchForm";

jest.mock("components/utils", () => ({
  ...jest.requireActual("components/utils"),
  copyToClipboard: jest.fn(),
}));

describe("SearchForm", () => {
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
    });
  });

  it("should initialise the form with the query from the URL", async () => {
    renderComponent(<SearchForm />, { state, url: "/?q=.applications" });
    expect(screen.getByRole("textbox")).toHaveTextContent(".applications");
  });

  it("performs a search if there is a query in the URL", async () => {
    const { store } = renderComponent(<SearchForm />, {
      state,
      url: "/?q=.applications",
    });
    const action = jujuActions.fetchCrossModelQuery({
      query: ".applications",
      wsControllerURL: "wss://controller.example.com",
    });
    expect(
      store.getActions().find((dispatch) => dispatch.type === action.type)
    ).toMatchObject(action);
  });

  it("submits the form if enter is pressed in the input", async () => {
    renderComponent(<SearchForm />, { state });
    await userEvent.type(screen.getByRole("textbox"), ".applications{Enter}");
    expect(window.location.search).toBe("?q=.applications");
  });

  it("should have the copy json button dissabled when cross model query isn't loaded", () => {
    renderComponent(<SearchForm />, { state, url: "/q=." });
    expect(
      screen.getByRole("button", {
        name: Label.COPY_JSON,
      })
    ).toBeDisabled();
  });

  it("should have the copy json button dissabled when cross model query is loading", () => {
    state.juju.crossModelQuery.loaded = true;
    state.juju.crossModelQuery.loading = true;
    renderComponent(<SearchForm />, { state, url: "/q=." });
    expect(
      screen.getByRole("button", {
        name: Label.COPY_JSON,
      })
    ).toBeDisabled();
  });

  it("should copy the cross-model query results", async () => {
    state.juju.crossModelQuery.loaded = true;
    state.juju.crossModelQuery.loading = false;
    state.juju.crossModelQuery.results = {
      mockModelUUID: [crossModelQueryFactory.withApplications().build()],
    };
    renderComponent(<SearchForm />, { state, url: "/q=." });
    const copyJSONButton = screen.getByRole("button", {
      name: Label.COPY_JSON,
    });
    expect(copyJSONButton).toBeEnabled();
    await userEvent.click(copyJSONButton);
    const jsonResponse = {
      mockModelUUID: [
        {
          applications: {
            application_0: {
              "application-status": {
                current: "pending",
                since: "16 Aug 2023 10:33:46+10:00",
              },
              base: {
                channel: "22.04",
                name: "ubuntu",
              },
              charm: "calico",
              "charm-channel": "stable",
              "charm-name": "calico",
              "charm-origin": "charmhub",
              "charm-rev": 87,
              "charm-version": "a164af4",
              "endpoint-bindings": {
                "": "alpha",
                cni: "alpha",
                etcd: "alpha",
              },
              exposed: false,
              relations: {
                cni: ["kubernetes-control-plane", "kubernetes-worker"],
                etcd: ["etcd"],
              },
              "subordinate-to": [
                "kubernetes-control-plane",
                "kubernetes-worker",
              ],
            },
          },
        },
      ],
    };
    expect(componentUtils.copyToClipboard).toHaveBeenCalledWith(
      JSON.stringify(jsonResponse, null, 2)
    );
  });
});
