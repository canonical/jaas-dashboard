import { screen, within } from "@testing-library/react";

import type { RootState } from "store/store";
import { rootStateFactory } from "testing/factories";
import { configFactory, generalStateFactory } from "testing/factories/general";
import {
  detailedStatusFactory,
  modelStatusInfoFactory,
} from "testing/factories/juju/ClientV6";
import { modelUserInfoFactory } from "testing/factories/juju/ModelManagerV9";
import {
  jujuStateFactory,
  modelDataApplicationFactory,
  modelDataFactory,
  modelDataInfoFactory,
  modelListInfoFactory,
} from "testing/factories/juju/juju";
import { renderComponent } from "testing/utils";

import StatusGroup from "./StatusGroup";

describe("StatusGroup", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory.build({
      juju: jujuStateFactory.build({
        modelData: {
          abc123: modelDataFactory.build({
            applications: {
              easyrsa: modelDataApplicationFactory.build({
                status: detailedStatusFactory.build({
                  status: "blocked",
                }),
              }),
            },
            info: modelDataInfoFactory.build({
              "controller-uuid": "controller123",
              uuid: "abc123",
            }),
            model: modelStatusInfoFactory.build({
              "cloud-tag": "cloud-aws",
            }),
            uuid: "abc123",
          }),
          def456: modelDataFactory.build({
            applications: {
              cockroachdb: modelDataApplicationFactory.build({
                status: detailedStatusFactory.build({
                  status: "blocked",
                }),
              }),
            },
            model: modelStatusInfoFactory.build({
              "cloud-tag": "cloud-aws",
            }),
          }),
          ghi789: modelDataFactory.build({
            applications: {
              elasticsearch: modelDataApplicationFactory.build({
                status: detailedStatusFactory.build({
                  status: "unknown",
                }),
              }),
            },
            model: modelStatusInfoFactory.build({
              "cloud-tag": "cloud-google",
            }),
          }),
          jkl101112: modelDataFactory.build({
            applications: {
              kibana: modelDataApplicationFactory.build({
                status: detailedStatusFactory.build({
                  status: "running",
                }),
              }),
            },
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

  it("by default, renders no tables when there is no data", () => {
    const state = rootStateFactory.build();
    renderComponent(<StatusGroup filters={{}} />, { state });
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("displays model data grouped by status from the redux store", () => {
    renderComponent(<StatusGroup filters={{}} />, { state });
    const tables = screen.getAllByRole("grid");
    expect(tables.length).toBe(3);
    expect(within(tables[0]).getAllByRole("row")).toHaveLength(3);
    expect(within(tables[1]).getAllByRole("row")).toHaveLength(2);
    expect(within(tables[2]).getAllByRole("row")).toHaveLength(2);
  });

  it("fetches filtered data if filters supplied", () => {
    const filters = {
      cloud: ["aws"],
    };
    renderComponent(<StatusGroup filters={filters} />, { state });
    expect(screen.getAllByRole("row").length).toBe(3);
  });

  it("displays the provider type icon", () => {
    renderComponent(<StatusGroup filters={{}} />, { state });
    expect(
      screen
        .getAllByTestId("provider-logo")[0]
        .getAttribute("src")
        ?.endsWith("/gce.svg"),
    ).toBe(true);
  });

  it("model access button is present in status group", () => {
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
    renderComponent(<StatusGroup filters={filters} />, { state });
    const firstContentRow = screen.getAllByRole("row")[1];
    expect(
      within(firstContentRow).getByRole("button", {
        name: "Access",
      }),
    ).toBeInTheDocument();
    expect(within(firstContentRow).getAllByRole("gridcell")[6]).toHaveClass(
      "lrg-screen-access-cell",
    );
  });

  it("displays links to blocked apps", async () => {
    state.juju.modelData.abc123.applications = {
      calico: modelDataApplicationFactory.build({
        status: detailedStatusFactory.build({
          info: "app blocked",
          status: "blocked",
        }),
      }),
    };
    renderComponent(<StatusGroup filters={{}} />, { state });
    const tables = screen.getAllByRole("grid");
    const row = within(tables[0]).getAllByRole("row")[1];
    const error = within(row).getByRole("link", { name: "app blocked" });
    expect(error).toHaveAttribute("href", "/models/eggman@external/sub-test");
  });
});
