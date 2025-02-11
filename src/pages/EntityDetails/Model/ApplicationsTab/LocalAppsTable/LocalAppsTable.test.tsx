import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { actions as jujuActions } from "store/juju";
import type { RootState } from "store/store";
import { jujuStateFactory, rootStateFactory } from "testing/factories";
import { generalStateFactory, configFactory } from "testing/factories/general";
import { charmApplicationFactory } from "testing/factories/juju/Charms";
import { modelUserInfoFactory } from "testing/factories/juju/ModelManagerV9";
import {
  modelDataFactory,
  modelDataInfoFactory,
} from "testing/factories/juju/juju";
import { modelWatcherModelDataFactory } from "testing/factories/juju/model-watcher";
import { renderComponent } from "testing/utils";

import LocalAppsTable from "./LocalAppsTable";
import { Label } from "./types";

describe("LocalAppsTable", () => {
  let state: RootState;
  const path = "/models/:userName/:modelName";
  const url = "/models/test@external/test-model";
  const searchURL = `${url}?filterQuery=db`;

  beforeEach(() => {
    state = rootStateFactory.build({
      general: generalStateFactory.build({
        config: configFactory.build({
          isJuju: true,
        }),
        controllerConnections: {
          "wss://jimm.jujucharms.com/api": {
            user: {
              "display-name": "eggman",
              identity: "user-eggman@external",
              "controller-access": "",
              "model-access": "",
            },
          },
        },
      }),
      juju: jujuStateFactory.build({
        models: {
          test123: {
            name: "test-model",
            uuid: "test123",
            ownerTag: "test@external",
            type: "iaas",
            wsControllerURL: "wss://jimm.jujucharms.com/api",
          },
        },
        modelData: {
          test123: modelDataFactory.build({
            info: modelDataInfoFactory.build({
              uuid: "test123",
              name: "test-model",
              "controller-uuid": "controller123",
              users: [
                modelUserInfoFactory.build({
                  user: "eggman@external",
                  access: "admin",
                }),
              ],
            }),
          }),
        },
        modelWatcherData: {
          test123: modelWatcherModelDataFactory.build({
            applications: {
              mysql1: charmApplicationFactory.build({
                name: "mysql1",
              }),
              mysql2: charmApplicationFactory.build({
                name: "mysql2",
              }),
              db2: charmApplicationFactory.build({
                name: "db2",
              }),
              db1: charmApplicationFactory.build({
                name: "db1",
              }),
              "jupyter-controller": charmApplicationFactory.build({
                name: "jupyter-controller",
              }),
              "jupyter-ui": charmApplicationFactory.build({
                name: "jupyter-ui",
              }),
              redis1: charmApplicationFactory.build({
                name: "redis1",
              }),
            },
            charms: {
              "ch:amd64/focal/postgresql-k8s-20": {
                "model-uuid": "test123",
                "charm-url": "ch:amd64/focal/postgresql-k8s-20",
                "charm-version": "",
                life: "alive",
                profile: null,
              },
            },
          }),
        },
      }),
    });
  });

  it("displays a message when there are no applications", () => {
    renderComponent(<LocalAppsTable applications={{}} />, { path, url, state });
    expect(screen.queryByText(Label.NONE)).toBeInTheDocument();
  });

  it("displays a message when there are no search results", () => {
    renderComponent(<LocalAppsTable applications={{}} />, {
      path,
      url: `${url}?filterQuery=nothingmatchesthis`,
      state,
    });
    expect(screen.queryByText(Label.NONE_SEARCH)).toBeInTheDocument();
  });

  it("shows all the application by default", () => {
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      { path, url, state },
    );
    expect(screen.queryAllByRole("row")).toHaveLength(8);
  });

  it("doesn't show the select column when there is no search", () => {
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      { path, url, state },
    );
    // first column not to be a checkbox
    expect(
      screen.queryAllByRole("columnheader")[0].querySelector("input"),
    ).not.toBeInTheDocument();
  });

  it("shows the select column when there is a search", () => {
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    // first column to be a checkbox
    expect(
      screen.queryAllByRole("columnheader")[0].querySelector("input"),
    ).toBeInTheDocument();
  });

  it("does not show the select column when the user only has read permissions", () => {
    state.juju.modelData.test123.info = modelDataInfoFactory.build({
      uuid: "test123",
      name: "test-model",
      "controller-uuid": "controller123",
      users: [
        modelUserInfoFactory.build({
          user: "eggman@external",
          access: "read",
        }),
      ],
    });
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    // The first column should not have a checkbox.
    expect(
      screen.queryAllByRole("columnheader")[0].querySelector("input"),
    ).not.toBeInTheDocument();
  });

  it("can select individual apps", async () => {
    const { store } = renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    await userEvent.click(screen.getByTestId("select-app-db1"));
    const actions = store.getActions();
    const db1 = state.juju.modelWatcherData?.test123.applications.db1;
    expect(db1).toBeTruthy();
    const expectedAction = jujuActions.updateSelectedApplications({
      selectedApplications: db1 ? [db1] : [],
    });
    expect(
      actions.find((action) => action.type === expectedAction.type),
    ).toMatchObject(expectedAction);
  });

  it("checks selected apps", async () => {
    if (state.juju.modelWatcherData?.test123.applications.db1) {
      state.juju.selectedApplications = [
        state.juju.modelWatcherData?.test123.applications.db1,
      ];
    }
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    expect(screen.getByTestId("select-app-db1")).toBeChecked();
  });

  it("can select all apps", async () => {
    const { store } = renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    await userEvent.click(screen.getByTestId("select-all-apps"));
    const actions = store.getActions();
    const apps = state.juju.modelWatcherData?.test123.applications;
    expect(apps).toBeTruthy();
    const expectedAction = jujuActions.updateSelectedApplications({
      selectedApplications: Object.values(apps ?? {}),
    });
    const action = actions.find(
      (action) => action.type === expectedAction.type,
    );
    expect(action.payload.selectedApplications).toHaveLength(
      expectedAction.payload.selectedApplications.length,
    );
    expect(action.payload.selectedApplications).toEqual(
      expect.arrayContaining(expectedAction.payload.selectedApplications),
    );
  });

  it("can deselect all apps", async () => {
    const apps = state.juju.modelWatcherData?.test123.applications;
    if (apps) {
      state.juju.selectedApplications = Object.values(apps);
    }
    const { store } = renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    await userEvent.click(screen.getByTestId("select-all-apps"));
    expect(screen.getByTestId("select-all-apps")).toBeChecked();
    await userEvent.click(screen.getByTestId("select-all-apps"));
    const actions = store.getActions();
    expect(apps).toBeTruthy();
    const expectedAction = jujuActions.updateSelectedApplications({
      selectedApplications: Object.values(apps ?? {}),
    });
    const selectActions = actions.filter(
      (action) => action.type === expectedAction.type,
    );
    expect(
      selectActions[selectActions.length - 1].payload.selectedApplications,
    ).toHaveLength(0);
    expect(
      selectActions[selectActions.length - 1].payload.selectedApplications,
    ).toStrictEqual([]);
  });

  it("checks the select all input when all the apps are selected", async () => {
    const apps = state.juju.modelWatcherData?.test123.applications;
    if (apps) {
      state.juju.selectedApplications = Object.values(apps);
    }
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    expect(screen.getByTestId("select-all-apps")).toBeChecked();
  });

  it("unchecks the select all input when one of the apps is deselected", async () => {
    const apps = state.juju.modelWatcherData?.test123.applications;
    if (apps) {
      state.juju.selectedApplications = Object.values(apps);
    }
    state.juju.selectedApplications.pop();
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    expect(screen.getByTestId("select-all-apps")).not.toBeChecked();
  });

  it("doesn't show the run action button when there is no search", () => {
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      { path, url, state },
    );
    expect(
      screen.queryByRole("button", { name: /run action/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the run action button when there is a search", () => {
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    expect(
      screen.queryByRole("button", { name: /run action/i }),
    ).toBeInTheDocument();
  });

  it("does not show the run action button when the user only has read permissions", () => {
    state.juju.modelData.test123.info = modelDataInfoFactory.build({
      uuid: "test123",
      name: "test-model",
      "controller-uuid": "controller123",
      users: [
        modelUserInfoFactory.build({
          user: "eggman@external",
          access: "read",
        }),
      ],
    });
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    expect(
      screen.queryByRole("button", { name: /run action/i }),
    ).not.toBeInTheDocument();
  });

  it("disables the run action button when there are no applications selected", () => {
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    expect(
      screen.queryByRole("button", { name: /run action/i }),
    ).toHaveAttribute("aria-disabled");
  });

  it("enables the run action button when there is at least one application selected", () => {
    state.juju.selectedApplications = [charmApplicationFactory.build()];
    renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    expect(
      screen.queryByRole("button", { name: /run action/i }),
    ).not.toHaveAttribute("aria-disabled");
  });

  it("opens the choose-charm panel when clicking the run action button", async () => {
    state.juju.selectedApplications = [charmApplicationFactory.build()];
    const { router } = renderComponent(
      <LocalAppsTable
        applications={state.juju.modelWatcherData?.test123.applications}
      />,
      {
        path,
        url: searchURL,
        state,
      },
    );
    expect(router.state.location.search).toEqual("?filterQuery=db");
    await userEvent.click(screen.getByRole("button", { name: /run action/i }));
    expect(router.state.location.search).toEqual(
      "?filterQuery=db&panel=select-charms-and-actions",
    );
  });
});
