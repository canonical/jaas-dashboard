import * as jujuLib from "@canonical/jujulib";
import type { Connection } from "@canonical/jujulib";
import { screen } from "@testing-library/react";

import { actions as jujuActions } from "store/juju";
import type { RootState } from "store/store";
import { jujuStateFactory, rootStateFactory } from "testing/factories";
import { fullStatusFactory } from "testing/factories/juju/ClientV6";
import { modelListInfoFactory } from "testing/factories/juju/juju";
import { modelWatcherModelDataFactory } from "testing/factories/juju/model-watcher";
import { renderComponent } from "testing/utils";
import urls from "urls";

import ModelDetails from "./ModelDetails";

jest.mock("pages/EntityDetails/App/App", () => {
  return () => <div data-testid="app"></div>;
});

jest.mock("pages/EntityDetails/Model/Model", () => {
  return () => <div data-testid="model"></div>;
});

jest.mock("pages/EntityDetails/Unit/Unit", () => {
  return () => <div data-testid="unit"></div>;
});

jest.mock("pages/EntityDetails/Machine/Machine", () => {
  return () => <div data-testid="machine"></div>;
});

jest.mock("@canonical/jujulib", () => ({
  connectAndLogin: jest.fn(),
}));

describe("ModelDetails", () => {
  let state: RootState;
  let client: {
    conn: Connection;
    logout: () => void;
  };
  const path = `${urls.model.index(null)}/*`;
  const url = urls.model.index({
    modelName: "test-model",
    userName: "eggman@external",
  });

  beforeEach(() => {
    state = rootStateFactory.withGeneralConfig().build({
      juju: jujuStateFactory.build({
        models: {
          abc123: modelListInfoFactory.build({
            uuid: "abc123",
            name: "test-model",
          }),
        },
        modelWatcherData: {
          abc123: modelWatcherModelDataFactory.build(),
        },
      }),
    });
    client = {
      conn: {
        facades: {
          client: {
            fullStatus: jest.fn(),
            watchAll: jest.fn().mockReturnValue({ "watcher-id": "123" }),
          },
          allWatcher: {
            next: jest.fn(),
            stop: jest.fn(),
          },
        },
        transport: {
          close: jest.fn(),
        },
      } as unknown as Connection,
      logout: jest.fn(),
    };
    jest
      .spyOn(jujuLib, "connectAndLogin")
      .mockImplementation(async () => client);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("should load the model and start the watcher", async () => {
    const status = fullStatusFactory.build();
    client.conn.facades.client.fullStatus.mockReturnValue(status);
    jest
      .spyOn(jujuLib, "connectAndLogin")
      .mockImplementation(async () => client);
    const { store } = renderComponent(<ModelDetails />, { path, url, state });
    const action = jujuActions.populateMissingAllWatcherData({
      uuid: "abc123",
      status,
    });
    // Wait for the component to be rendered so that async methods have completed.
    await screen.findByTestId("model");
    expect(
      store.getActions().find((dispatch) => dispatch.type === action.type)
    ).toMatchObject(action);
    expect(client.conn.facades.client.watchAll).toHaveBeenCalled();
  });

  it("should stop watching the model on unmount", async () => {
    const { result } = renderComponent(<ModelDetails />, { path, url, state });
    // Wait for the component to be rendered so that async methods have completed.
    await screen.findByTestId("model");
    result.unmount();
    expect(client.conn.facades.allWatcher.stop).toHaveBeenCalled();
  });

  it("should display the model page", async () => {
    renderComponent(<ModelDetails />, { path, url, state });
    expect(await screen.findByTestId("model")).toBeInTheDocument();
  });

  it("should display the app page", async () => {
    renderComponent(<ModelDetails />, {
      path,
      url: urls.model.app.index({
        modelName: "test-model",
        userName: "eggman@external",
        appName: "ceph",
      }),
      state,
    });
    expect(await screen.findByTestId("app")).toBeInTheDocument();
  });

  it("should display the unit page", async () => {
    renderComponent(<ModelDetails />, {
      path,
      url: urls.model.unit({
        modelName: "test-model",
        userName: "eggman@external",
        appName: "ceph",
        unitId: "ceph-0",
      }),
      state,
    });
    expect(await screen.findByTestId("unit")).toBeInTheDocument();
  });

  it("should display the machine page", async () => {
    renderComponent(<ModelDetails />, {
      path,
      url: urls.model.machine({
        modelName: "test-model",
        userName: "eggman@external",
        machineId: "1",
      }),
      state,
    });
    expect(await screen.findByTestId("machine")).toBeInTheDocument();
  });
});
