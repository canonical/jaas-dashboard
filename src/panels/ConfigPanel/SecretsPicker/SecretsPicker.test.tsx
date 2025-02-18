import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { FieldsLabel } from "components/secrets/SecretForm/Fields";
import * as secretHooks from "juju/api-hooks/secrets";
import type { RootState } from "store/store";
import { rootStateFactory } from "testing/factories";
import {
  configFactory,
  generalStateFactory,
  credentialFactory,
} from "testing/factories/general";
import { modelUserInfoFactory } from "testing/factories/juju/ModelManagerV9";
import {
  modelListInfoFactory,
  secretsStateFactory,
  listSecretResultFactory,
  modelSecretsFactory,
  modelFeaturesFactory,
  modelFeaturesStateFactory,
  modelDataFactory,
  modelDataInfoFactory,
} from "testing/factories/juju/juju";
import { renderComponent } from "testing/utils";
import urls from "urls";

import SecretsPicker from "./SecretsPicker";
import { Label } from "./types";

describe("SecretsPicker", () => {
  let state: RootState;
  const path = urls.model.index(null);
  const url = urls.model.index({
    userName: "eggman@external",
    modelName: "test-model",
  });

  beforeEach(() => {
    state = rootStateFactory.build({
      general: generalStateFactory.build({
        credentials: {
          "wss://example.com/api": credentialFactory.build(),
        },
        config: configFactory.build({
          isJuju: true,
          controllerAPIEndpoint: "wss://example.com/api",
        }),
        controllerConnections: {
          "wss://example.com/api": {
            user: {
              "display-name": "eggman",
              identity: "user-eggman@external",
              "controller-access": "",
              "model-access": "",
            },
          },
        },
      }),
      juju: {
        models: {
          abc123: modelListInfoFactory.build({
            wsControllerURL: "wss://example.com/api",
            uuid: "abc123",
          }),
        },
        modelData: {
          abc123: modelDataFactory.build({
            info: modelDataInfoFactory.build({
              uuid: "abc123",
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
        modelFeatures: modelFeaturesStateFactory.build({
          abc123: modelFeaturesFactory.build({
            manageSecrets: true,
          }),
        }),
        secrets: secretsStateFactory.build({
          abc123: modelSecretsFactory.build({
            items: [
              listSecretResultFactory.build({
                label: "secret1",
                uri: "secret:aabbccdd",
              }),
              listSecretResultFactory.build({ uri: "secret:eeffgghh" }),
            ],
            loaded: true,
          }),
        }),
      },
    });
  });

  it("displays a spinner while loading secrets the first time", async () => {
    state.juju.secrets.abc123.loading = true;
    state.juju.secrets.abc123.loaded = false;
    renderComponent(<SecretsPicker setValue={vi.fn()} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    expect(
      screen.getByRole("alert", { name: Label.LOADING }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "secret1 (aabbccdd)" }),
    ).not.toBeInTheDocument();
  });

  it("displays secrets while reloading secrets", async () => {
    state.juju.secrets.abc123.loading = true;
    state.juju.secrets.abc123.loaded = true;
    renderComponent(<SecretsPicker setValue={vi.fn()} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    expect(
      screen.getByRole("button", { name: "secret1 (aabbccdd)" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("alert", { name: Label.LOADING }),
    ).not.toBeInTheDocument();
  });

  it("displays secret errors", async () => {
    state.juju.secrets.abc123.errors = "Uh oh!";
    renderComponent(<SecretsPicker setValue={vi.fn()} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    expect(screen.getByText("Uh oh!")).toBeInTheDocument();
  });

  it("lists the secrets", async () => {
    renderComponent(<SecretsPicker setValue={vi.fn()} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    expect(
      screen.getByRole("button", { name: "secret1 (aabbccdd)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "eeffgghh" }),
    ).toBeInTheDocument();
  });

  it("does not include app-owned secrets in the list", async () => {
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({
            label: "secret1",
            uri: "secret:aabbccdd",
          }),
          listSecretResultFactory.build({
            uri: "secret:eeffgghh",
            "owner-tag": "application-etcd",
          }),
        ],
        loaded: true,
      }),
    });
    renderComponent(<SecretsPicker setValue={vi.fn()} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    expect(
      screen.getByRole("button", { name: "secret1 (aabbccdd)" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "eeffgghh" }),
    ).not.toBeInTheDocument();
  });

  it("can set the secret value", async () => {
    const setValue = vi.fn();
    renderComponent(<SecretsPicker setValue={setValue} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    await userEvent.click(screen.getByRole("button", { name: "eeffgghh" }));
    expect(setValue).toHaveBeenCalledWith("secret:eeffgghh");
  });

  it("does not display the add secret button if secrets can't be managed", async () => {
    state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
      manageSecrets: false,
    });
    renderComponent(<SecretsPicker setValue={vi.fn()} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    expect(
      screen.queryByRole("button", { name: Label.BUTTON_ADD }),
    ).not.toBeInTheDocument();
  });

  it("displays a 'no secrets' message if secrets can't be managed", async () => {
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [],
        loaded: true,
      }),
    });
    state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
      manageSecrets: false,
    });
    renderComponent(<SecretsPicker setValue={vi.fn()} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    expect(
      screen.queryByRole("button", { name: Label.BUTTON_ADD }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(Label.NONE)).toBeInTheDocument();
  });

  it("displays an 'add secret' button if secrets can be managed", async () => {
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [],
        loaded: true,
      }),
    });
    state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
      manageSecrets: true,
    });
    renderComponent(<SecretsPicker setValue={vi.fn()} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    expect(
      screen.getByRole("button", { name: Label.BUTTON_ADD }),
    ).toBeInTheDocument();
    expect(screen.queryByText(Label.NONE)).not.toBeInTheDocument();
  });

  it("can open the add secret form", async () => {
    state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
      manageSecrets: true,
    });
    renderComponent(<SecretsPicker setValue={vi.fn()} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.BUTTON_ADD }),
    );
    expect(
      screen.getByRole("dialog", { name: Label.MODAL_TITLE }),
    ).toBeInTheDocument();
  });

  it("can close the add secret form", async () => {
    state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
      manageSecrets: true,
    });
    renderComponent(<SecretsPicker setValue={vi.fn()} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.BUTTON_ADD }),
    );
    expect(
      screen.getByRole("dialog", { name: Label.MODAL_TITLE }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Close active modal" }),
    );
    expect(
      screen.queryByRole("dialog", { name: Label.MODAL_TITLE }),
    ).not.toBeInTheDocument();
  });

  it("can create and set the secret value", async () => {
    state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
      manageSecrets: true,
    });
    const createSecrets = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ results: [{ result: "secret:newlycreated" }] }),
      );
    vi.spyOn(secretHooks, "useCreateSecrets").mockImplementation(
      () => createSecrets,
    );
    const setValue = vi.fn();
    renderComponent(<SecretsPicker setValue={setValue} />, {
      state,
      url,
      path,
    });
    await userEvent.click(
      screen.getByRole("button", { name: Label.CHOOSE_SECRET }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.BUTTON_ADD }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: `${FieldsLabel.KEY} 1` }),
      "a key",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: `${FieldsLabel.VALUE} 1` }),
      "a value",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.BUTTON_SUBMIT }),
    );
    expect(setValue).toHaveBeenCalledWith("secret:newlycreated");
    expect(
      screen.queryByRole("dialog", { name: Label.MODAL_TITLE }),
    ).not.toBeInTheDocument();
  });
});
