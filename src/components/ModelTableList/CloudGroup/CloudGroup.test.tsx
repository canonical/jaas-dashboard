import { screen, within } from "@testing-library/react";

import type { RootState } from "store/store";
import { configFactory, generalStateFactory } from "testing/factories/general";
import { modelStatusInfoFactory } from "testing/factories/juju/ClientV6";
import { modelUserInfoFactory } from "testing/factories/juju/ModelManagerV9";
import {
  jujuStateFactory,
  modelDataFactory,
  modelDataInfoFactory,
  modelListInfoFactory,
} from "testing/factories/juju/juju";
import { rootStateFactory } from "testing/factories/root";
import { renderComponent } from "testing/utils";

import CloudGroup from "./CloudGroup";

describe("CloudGroup", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory.build({
      juju: jujuStateFactory.build({
        modelData: {
          abc123: modelDataFactory.build({
            info: modelDataInfoFactory.build({
              "controller-uuid": "controller123",
              "cloud-tag": "cloud-aws",
              uuid: "abc123",
            }),
            model: modelStatusInfoFactory.build({
              "cloud-tag": "cloud-aws",
            }),
            uuid: "abc123",
          }),
          def456: modelDataFactory.build({
            info: modelDataInfoFactory.build({
              "cloud-tag": "cloud-aws",
            }),
            model: modelStatusInfoFactory.build({
              "cloud-tag": "cloud-aws",
            }),
          }),
          ghi789: modelDataFactory.build({
            info: modelDataInfoFactory.build({
              "cloud-tag": "cloud-google",
            }),
            model: modelStatusInfoFactory.build({
              "cloud-tag": "cloud-google",
            }),
          }),
        },
        models: {
          abc123: modelListInfoFactory.build({
            uuid: "abc123",
            wsControllerURL: "wss://jimm.jujucharms.com/api",
          }),
        },
      }),
    });
  });

  it("by default, renders no tables with no data", () => {
    state = rootStateFactory.build();
    renderComponent(<CloudGroup filters={{}} />, { state });
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("displays model data grouped by cloud from the redux store", () => {
    renderComponent(<CloudGroup filters={{}} />, { state });
    const tables = screen.getAllByRole("grid");
    expect(tables.length).toBe(2);
    expect(within(tables[0]).getAllByRole("row")).toHaveLength(3);
    expect(within(tables[1]).getAllByRole("row")).toHaveLength(2);
  });

  it("fetches filtered data if filters supplied", () => {
    const filters = {
      cloud: ["aws"],
    };
    renderComponent(<CloudGroup filters={filters} />, { state });
    const tables = screen.getAllByRole("grid");
    expect(tables.length).toBe(1);
    expect(within(tables[0]).getAllByRole("row")).toHaveLength(3);
  });

  it("model access button is present in cloud group", () => {
    state.general = generalStateFactory.build({
      config: configFactory.build({
        isJuju: true,
        controllerAPIEndpoint: "wss://jimm.jujucharms.com/api",
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
    });
    state.juju.modelData.abc123.info = modelDataInfoFactory.build({
      "cloud-tag": "cloud-aws",
      "controller-uuid": "controller123",
      users: [
        modelUserInfoFactory.build({
          user: "eggman@external",
          access: "admin",
        }),
      ],
    });
    const filters = {
      cloud: ["aws"],
    };
    renderComponent(<CloudGroup filters={filters} />, { state });
    const firstContentRow = screen.getAllByRole("row")[1];
    expect(
      within(firstContentRow).getByRole("button", {
        name: "Access",
      }),
    ).toBeInTheDocument();
    expect(within(firstContentRow).getAllByRole("gridcell")[7]).toHaveClass(
      "lrg-screen-access-cell",
    );
  });
});
