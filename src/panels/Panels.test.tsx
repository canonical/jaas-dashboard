import { screen } from "@testing-library/react";

import type { RootState } from "store/store";
import { rootStateFactory } from "testing/factories";
import {
  generalStateFactory,
  configFactory,
  credentialFactory,
} from "testing/factories/general";
import { modelUserInfoFactory } from "testing/factories/juju/ModelManagerV9";
import {
  modelFeaturesFactory,
  jujuStateFactory,
  modelDataFactory,
  modelListInfoFactory,
  modelDataInfoFactory,
} from "testing/factories/juju/juju";
import { modelWatcherModelDataFactory } from "testing/factories/juju/model-watcher";
import { renderComponent } from "testing/utils";

import { ActionsPanelTestId } from "./ActionsPanel";
import { AuditLogsFilterPanelTestId } from "./AuditLogsFilterPanel";
import { CharmsAndActionsPanelTestId } from "./CharmsAndActionsPanel";
import { ConfigPanelTestId } from "./ConfigPanel";
import { GrantSecretPanelTestId } from "./GrantSecretPanel";
import Panels from "./Panels";
import { RemoveSecretPanelTestId } from "./RemoveSecretPanel";
import { SecretFormPanelTestId } from "./SecretFormPanel";
import { ShareModelTestId } from "./ShareModelPanel";

describe("Panels", () => {
  it("can display the actions panel", () => {
    renderComponent(<Panels />, { url: "/?panel=execute-action" });
    expect(screen.getByTestId(ActionsPanelTestId.PANEL)).toBeInTheDocument();
  });

  it("can display the share panel", () => {
    renderComponent(<Panels />, { url: "/?panel=share-model" });
    expect(screen.getByTestId(ShareModelTestId.PANEL)).toBeInTheDocument();
  });

  it("can display the choose charm panel", async () => {
    renderComponent(<Panels />, { url: "/?panel=select-charms-and-actions" });
    expect(
      screen.getByTestId(CharmsAndActionsPanelTestId.PANEL),
    ).toBeInTheDocument();
  });

  it("can display the config panel", async () => {
    renderComponent(<Panels />, {
      url: "/?panel=config&entity=easyrsa&charm=cs:easyrsa&modelUUID=abc123",
    });
    expect(
      await screen.findByTestId(ConfigPanelTestId.PANEL),
    ).toBeInTheDocument();
  });

  it("can display the audit logs filter panel", async () => {
    renderComponent(<Panels />, {
      url: "/?panel=audit-log-filters",
    });
    expect(
      await screen.findByTestId(AuditLogsFilterPanelTestId.PANEL),
    ).toBeInTheDocument();
  });

  describe("secret panels", () => {
    let state: RootState;
    const url = "/models/eggman@external/test1";
    const path = "/models/:userName/:modelName";

    beforeEach(() => {
      state = rootStateFactory.build({
        general: generalStateFactory.build({
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
          credentials: {
            "wss://jimm.jujucharms.com/api": credentialFactory.build(),
          },
        }),
        juju: jujuStateFactory.build({
          modelData: {
            abc123: modelDataFactory.build({
              info: modelDataInfoFactory.build({
                uuid: "abc123",
                name: "test1",
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
          models: {
            abc123: modelListInfoFactory.build({
              uuid: "abc123",
              name: "test1",
              wsControllerURL: "wss://jimm.jujucharms.com/api",
            }),
          },
          modelWatcherData: {
            abc123: modelWatcherModelDataFactory.build(),
          },
        }),
      });
    });

    it("can display the add secret panel", async () => {
      state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
        manageSecrets: true,
      });
      renderComponent(<Panels />, {
        state,
        path,
        url: `${url}/?panel=add-secret`,
      });
      expect(
        await screen.findByTestId(SecretFormPanelTestId.PANEL),
      ).toBeInTheDocument();
    });

    it("can display the update secret panel", async () => {
      state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
        manageSecrets: true,
      });
      renderComponent(<Panels />, {
        state,
        path,
        url: `${url}/?panel=update-secret`,
      });
      expect(
        await screen.findByTestId(SecretFormPanelTestId.PANEL),
      ).toBeInTheDocument();
    });

    it("can display the remove secret panel", async () => {
      state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
        manageSecrets: true,
      });
      renderComponent(<Panels />, {
        state,
        path,
        url: `${url}/?panel=remove-secret`,
      });
      expect(
        await screen.findByTestId(RemoveSecretPanelTestId.PANEL),
      ).toBeInTheDocument();
    });

    it("can display the grant secret panel", async () => {
      state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
        manageSecrets: true,
      });
      renderComponent(<Panels />, {
        state,
        path,
        url: `${url}/?panel=grant-secret`,
      });
      expect(
        await screen.findByTestId(GrantSecretPanelTestId.PANEL),
      ).toBeInTheDocument();
    });

    it("doesn't display the add secret panel if the model doesn't support it", async () => {
      state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
        manageSecrets: false,
      });
      renderComponent(<Panels />, {
        state,
        path,
        url: `${url}/?panel=add-secret`,
      });
      expect(
        screen.queryByTestId(SecretFormPanelTestId.PANEL),
      ).not.toBeInTheDocument();
    });

    it("doesn't display the update secret panel if the model doesn't support it", async () => {
      renderComponent(<Panels />, {
        state,
        path,
        url: `${url}/?panel=update-secret`,
      });
      expect(
        screen.queryByTestId(SecretFormPanelTestId.PANEL),
      ).not.toBeInTheDocument();
    });

    it("doesn't display the remove secret panel if the model doesn't support it", async () => {
      renderComponent(<Panels />, {
        state,
        path,
        url: `${url}/?panel=remove-secret`,
      });
      expect(
        screen.queryByTestId(RemoveSecretPanelTestId.PANEL),
      ).not.toBeInTheDocument();
    });

    it("doesn't display the grant secret panel if the model doesn't support it", async () => {
      renderComponent(<Panels />, {
        state,
        path,
        url: `${url}/?panel=grant-secret`,
      });
      expect(
        screen.queryByTestId(GrantSecretPanelTestId.PANEL),
      ).not.toBeInTheDocument();
    });
  });
});
