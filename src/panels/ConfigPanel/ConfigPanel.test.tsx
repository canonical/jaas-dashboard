import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as applicationHooks from "juju/api-hooks/application";
import * as secretHooks from "juju/api-hooks/secrets";
import type { RootState } from "store/store";
import {
  generalStateFactory,
  credentialFactory,
} from "testing/factories/general";
import {
  applicationGetFactory,
  configFactory,
} from "testing/factories/juju/Application";
import { modelUserInfoFactory } from "testing/factories/juju/ModelManagerV9";
import {
  controllerFactory,
  jujuStateFactory,
  modelDataFactory,
  modelDataInfoFactory,
  modelFeaturesStateFactory,
  modelFeaturesFactory,
  secretsStateFactory,
  listSecretResultFactory,
  modelSecretsFactory,
} from "testing/factories/juju/juju";
import {
  secretAccessInfoFactory,
  modelListInfoFactory,
} from "testing/factories/juju/juju";
import { rootStateFactory } from "testing/factories/root";
import { renderComponent } from "testing/utils";

import ConfigPanel, { Label } from "./ConfigPanel";

jest.mock("juju/api-hooks/application", () => ({
  useGetApplicationConfig: jest.fn(),
  useSetApplicationConfig: jest.fn(),
}));

jest.mock("juju/api-hooks/secrets", () => {
  return {
    useGrantSecret: jest.fn().mockReturnValue(jest.fn()),
    useListSecrets: jest.fn().mockReturnValue(jest.fn()),
    useRevokeSecret: jest.fn().mockReturnValue(jest.fn()),
  };
});

describe("ConfigPanel", () => {
  let state: RootState;
  const params = new URLSearchParams({
    entity: "easyrsa",
    charm: "cs:easyrsa",
    modelUUID: "abc123",
    panel: "config",
  });
  const url = `/models/eggman@external/hadoopspark?${params.toString()}`;
  const path = "/models/:userName/:modelName";
  let getApplicationConfig: jest.Mock;
  const consoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
    jest.resetModules();
    jest
      .spyOn(secretHooks, "useListSecrets")
      .mockImplementation(() => jest.fn());
    state = rootStateFactory.build({
      general: generalStateFactory.build({
        config: configFactory.build({
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
        credentials: {
          "wss://example.com/api": credentialFactory.build(),
        },
      }),
      juju: jujuStateFactory.build({
        controllers: {
          "wss://example.com/api": [
            controllerFactory.build({ path: "admin/jaas", uuid: "123" }),
          ],
        },
        models: {
          abc123: modelListInfoFactory.build({
            name: "hadoopspark",
            wsControllerURL: "wss://example.com/api",
            uuid: "abc123",
          }),
        },
        modelData: {
          abc123: modelDataFactory.build({
            info: modelDataInfoFactory.build({
              "controller-uuid": "123",
              name: "hadoopspark",
              users: [
                modelUserInfoFactory.build({ user: "eggman@external" }),
                modelUserInfoFactory.build({ user: "spaceman@domain" }),
              ],
            }),
          }),
        },
        modelFeatures: modelFeaturesStateFactory.build({
          abc123: modelFeaturesFactory.build({
            manageSecrets: true,
          }),
        }),
      }),
    });
    getApplicationConfig = jest.fn().mockImplementation(() =>
      Promise.resolve(
        applicationGetFactory.build({
          config: {
            email: configFactory.build({ default: "" }),
            name: configFactory.build({ default: "eggman" }),
          },
        }),
      ),
    );
    jest
      .spyOn(applicationHooks, "useGetApplicationConfig")
      .mockImplementation(() => getApplicationConfig);
    const setApplicationConfig = jest
      .fn()
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(applicationHooks, "useSetApplicationConfig")
      .mockImplementation(() => setApplicationConfig);
  });

  afterEach(() => {
    console.error = consoleError;
    jest.restoreAllMocks();
  });

  it("displays a message if the app has no config", async () => {
    getApplicationConfig = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(applicationGetFactory.build({ config: {} })),
      );
    jest
      .spyOn(applicationHooks, "useGetApplicationConfig")
      .mockImplementation(() => getApplicationConfig);
    renderComponent(<ConfigPanel />, { state, path, url });
    // Use findBy to wait for the async events to finish
    await screen.findByText(Label.NONE);
    expect(document.querySelector(".config-panel__message")).toMatchSnapshot();
  });

  it("can display boolean, number and text fields", async () => {
    getApplicationConfig = jest.fn().mockImplementation(() =>
      Promise.resolve(
        applicationGetFactory.build({
          config: {
            name: configFactory.build({ type: "string" }),
            age: configFactory.build({ type: "int" }),
            confirm: configFactory.build({ type: "boolean" }),
          },
        }),
      ),
    );
    jest
      .spyOn(applicationHooks, "useGetApplicationConfig")
      .mockImplementation(() => getApplicationConfig);
    renderComponent(<ConfigPanel />, { state, path, url });
    expect(
      within(await screen.findByTestId("name")).getByRole("textbox"),
    ).toBeInTheDocument();
    expect(
      within(await screen.findByTestId("age")).getByRole("spinbutton"),
    ).toBeInTheDocument();
    expect(
      within(await screen.findByTestId("confirm")).getAllByRole("radio"),
    ).toHaveLength(2);
  });

  it("highlights changed fields before save", async () => {
    renderComponent(<ConfigPanel />, { state, path, url });
    const wrapper = await screen.findByTestId("email");
    const input = within(wrapper).getByRole("textbox");
    await userEvent.type(input, "new value");
    expect(input).toHaveTextContent("new value");
    expect(wrapper).toHaveClass("config-input--changed");
  });

  it("can reset all fields", async () => {
    renderComponent(<ConfigPanel />, { state, path, url });
    const email = within(await screen.findByTestId("email")).getByRole(
      "textbox",
    );
    const name = within(await screen.findByTestId("name")).getByRole("textbox");
    await userEvent.type(email, "eggman@example.com");
    await userEvent.type(name, "not eggman");
    expect(email).toHaveTextContent("eggman@example.com");
    expect(name).toHaveTextContent("not eggman");
    await userEvent.click(
      screen.getByRole("button", { name: Label.RESET_BUTTON }),
    );
    expect(email).toHaveTextContent("");
    expect(name).toHaveTextContent("eggman");
  });

  it("displays a confirmation when clicking outside and there are unsaved changes", async () => {
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "eggman@example.com",
    );
    await userEvent.click(document.body);
    expect(
      within(
        screen.getByRole("dialog", {
          name: Label.CANCEL_CONFIRM,
        }),
      ).getByRole("heading", {
        name: Label.CANCEL_CONFIRM,
      }),
    ).toBeInTheDocument();
    expect(window.location.search).toBe(`?${params.toString()}`);
  });

  it("closes when clicking outside and there are no unsaved changes", async () => {
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.click(document.body);
    expect(
      within(screen.getByRole("dialog", { name: "" })).queryByRole("heading", {
        name: Label.CANCEL_CONFIRM,
      }),
    ).not.toBeInTheDocument();
    expect(window.location.search).toBeFalsy();
  });

  it("displays a confirmation when cancelling and there are unsaved changes", async () => {
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "eggman@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.CANCEL_BUTTON }),
    );
    expect(
      within(
        screen.getByRole("dialog", {
          name: Label.CANCEL_CONFIRM,
        }),
      ).getByRole("heading", {
        name: Label.CANCEL_CONFIRM,
      }),
    ).toBeInTheDocument();
    expect(window.location.search).toBe(`?${params.toString()}`);
  });

  it("can confirm the cancel confirmation", async () => {
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "eggman@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.CANCEL_BUTTON }),
    );
    expect(
      within(
        screen.getByRole("dialog", {
          name: Label.CANCEL_CONFIRM,
        }),
      ).getByRole("heading", {
        name: Label.CANCEL_CONFIRM,
      }),
    ).toBeInTheDocument();
    expect(window.location.search).toBe(`?${params.toString()}`);
    await userEvent.click(
      screen.getByRole("button", { name: Label.CANCEL_CONFIRM_CONFIRM_BUTTON }),
    );
    expect(window.location.search).toBeFalsy();
  });

  it("can cancel the cancel confirmation", async () => {
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "eggman@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.CANCEL_BUTTON }),
    );
    expect(
      within(
        screen.getByRole("dialog", {
          name: Label.CANCEL_CONFIRM,
        }),
      ).getByRole("heading", {
        name: Label.CANCEL_CONFIRM,
      }),
    ).toBeInTheDocument();
    expect(window.location.search).toBe(`?${params.toString()}`);
    await userEvent.click(
      screen.getByRole("button", { name: Label.CANCEL_CONFIRM_CANCEL_BUTTON }),
    );
    expect(window.location.search).toBe(`?${params.toString()}`);
  });

  it("closes when cancelling and there are no unsaved changes", async () => {
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.click(
      await screen.findByRole("button", { name: Label.CANCEL_BUTTON }),
    );
    expect(
      within(screen.getByRole("dialog", { name: "" })).queryByRole("heading", {
        name: Label.CANCEL_CONFIRM,
      }),
    ).not.toBeInTheDocument();
    expect(window.location.search).toBeFalsy();
  });

  it("displays a confirmation before saving", async () => {
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "eggman@example.com",
    );
    await userEvent.type(
      within(await screen.findByTestId("name")).getByRole("textbox"),
      "noteggman",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    expect(
      within(
        screen.getByRole("dialog", {
          name: Label.SAVE_CONFIRM,
        }),
      ).getByRole("heading", {
        name: Label.SAVE_CONFIRM,
      }),
    ).toBeInTheDocument();
  });

  it("can cancel the save confirmation", async () => {
    const setApplicationConfig = jest
      .fn()
      .mockImplementation(() => Promise.resolve());
    jest
      .spyOn(applicationHooks, "useSetApplicationConfig")
      .mockImplementation(() => setApplicationConfig);
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "eggman@example.com",
    );
    await userEvent.type(
      within(await screen.findByTestId("name")).getByRole("textbox"),
      "noteggman",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    expect(
      within(
        screen.getByRole("dialog", {
          name: Label.SAVE_CONFIRM,
        }),
      ).getByRole("heading", {
        name: Label.SAVE_CONFIRM,
      }),
    ).toBeInTheDocument();
    await userEvent.click(
      within(
        screen.getByRole("dialog", {
          name: Label.SAVE_CONFIRM,
        }),
      ).getByRole("button", {
        name: Label.SAVE_CONFIRM_CANCEL_BUTTON,
      }),
    );
    expect(screen.queryByRole("dialog", { name: "" })).not.toBeInTheDocument();
    expect(setApplicationConfig).not.toHaveBeenCalled();
  });

  it("can save changes", async () => {
    const setApplicationConfig = jest
      .fn()
      .mockImplementation(() => Promise.resolve({ results: [] }));
    jest
      .spyOn(applicationHooks, "useSetApplicationConfig")
      .mockImplementation(() => setApplicationConfig);
    renderComponent(<ConfigPanel />, { state, path, url });
    expect(getApplicationConfig).toHaveBeenCalledTimes(1);
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "eggman@example.com",
    );
    await userEvent.type(
      within(await screen.findByTestId("name")).getByRole("textbox"),
      "noteggman",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    expect(setApplicationConfig).toHaveBeenCalledWith("easyrsa", {
      email: configFactory.build({
        name: "email",
        default: "",
        newValue: "eggman@example.com",
      }),
      name: configFactory.build({
        name: "name",
        default: "eggman",
        newValue: "noteggman",
      }),
    });
    expect(getApplicationConfig).toHaveBeenCalledTimes(1);
  });

  it("displays save errors", async () => {
    const setApplicationConfig = jest.fn().mockImplementation(() =>
      Promise.resolve({
        results: [{ error: { code: "1", message: "That's not a name" } }],
      }),
    );
    jest
      .spyOn(applicationHooks, "useSetApplicationConfig")
      .mockImplementation(() => setApplicationConfig);
    renderComponent(<ConfigPanel />, { state, path, url });
    expect(getApplicationConfig).toHaveBeenCalledTimes(1);
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "eggman@example.com",
    );
    await userEvent.type(
      within(await screen.findByTestId("name")).getByRole("textbox"),
      "noteggman",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    expect(screen.getByText("That's not a name")).toBeInTheDocument();
    expect(getApplicationConfig).toHaveBeenCalledTimes(1);
  });

  it("should display error when trying to get config and refetch config data", async () => {
    getApplicationConfig = jest
      .fn()
      .mockImplementation(() =>
        Promise.reject(new Error("Error while calling getApplicationConfig")),
      );
    jest
      .spyOn(applicationHooks, "useGetApplicationConfig")
      .mockImplementation(() => getApplicationConfig);
    renderComponent(<ConfigPanel />, { state, path, url });
    expect(getApplicationConfig).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        Label.GET_CONFIG_ERROR,
        new Error("Error while calling getApplicationConfig"),
      );
    });
    const configErrorNotification = screen.getByText(Label.GET_CONFIG_ERROR, {
      exact: false,
    });
    expect(configErrorNotification).toBeInTheDocument();
    expect(configErrorNotification.childElementCount).toBe(1);
    const refetchButton = configErrorNotification.children[0];
    expect(refetchButton).toHaveTextContent("refetch");
    await userEvent.click(refetchButton);
    expect(getApplicationConfig).toHaveBeenCalledTimes(2);
  });

  it("should display error when trying to save", async () => {
    getApplicationConfig = jest.fn().mockImplementationOnce(() =>
      Promise.resolve(
        applicationGetFactory.build({
          config: {
            email: configFactory.build({ default: "" }),
            name: configFactory.build({ default: "eggman" }),
          },
        }),
      ),
    );
    jest
      .spyOn(applicationHooks, "useGetApplicationConfig")
      .mockImplementation(() => getApplicationConfig);
    const setApplicationConfig = jest
      .fn()
      .mockImplementation(() =>
        Promise.reject(new Error("Error while trying to save")),
      );
    jest
      .spyOn(applicationHooks, "useSetApplicationConfig")
      .mockImplementation(() => setApplicationConfig);
    renderComponent(<ConfigPanel />, { state, path, url });
    expect(getApplicationConfig).toHaveBeenCalledTimes(1);
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "eggman@example.com",
    );
    await userEvent.type(
      within(await screen.findByTestId("name")).getByRole("textbox"),
      "noteggman",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    expect(setApplicationConfig).toHaveBeenCalledWith("easyrsa", {
      email: configFactory.build({
        name: "email",
        default: "",
        newValue: "eggman@example.com",
      }),
      name: configFactory.build({
        name: "name",
        default: "eggman",
        newValue: "noteggman",
      }),
    });
    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        Label.SUBMIT_TO_JUJU_ERROR,
        new Error("Error while trying to save"),
      ),
    );
    expect(
      screen.getByText(Label.SUBMIT_TO_JUJU_ERROR, { exact: false }),
    ).toBeInTheDocument();
  });

  it("displays a confirmation if there are ungranted secrets in string fields", async () => {
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({ access: [], uri: "secret:aabbccdd" }),
        ],
        loaded: true,
      }),
    });
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "secret:aabbccdd",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    expect(
      screen.getByRole("dialog", {
        name: Label.GRANT_CONFIRM,
      }),
    ).toBeInTheDocument();
  });

  it("displays a confirmation if there are ungranted secrets in secret fields", async () => {
    getApplicationConfig = jest.fn().mockImplementation(() =>
      Promise.resolve(
        applicationGetFactory.build({
          config: {
            email: configFactory.build({ default: "", type: "secret" }),
            name: configFactory.build({ default: "eggman" }),
          },
        }),
      ),
    );
    jest
      .spyOn(applicationHooks, "useGetApplicationConfig")
      .mockImplementation(() => getApplicationConfig);
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({ access: [], uri: "secret:aabbccdd" }),
        ],
        loaded: true,
      }),
    });
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "secret:aabbccdd",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    expect(
      screen.getByRole("dialog", {
        name: Label.GRANT_CONFIRM,
      }),
    ).toBeInTheDocument();
  });

  it("does not display a confirmation if no fields contain a secret", async () => {
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "notasecret",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    expect(
      screen.queryByRole("dialog", {
        name: Label.GRANT_CONFIRM,
      }),
    ).not.toBeInTheDocument();
  });

  it("does not display a confirmation if all secrets are granted", async () => {
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({
            access: [
              secretAccessInfoFactory.build({
                "target-tag": "application-easyrsa",
              }),
            ],
            uri: "secret:aabbccdd",
          }),
        ],
        loaded: true,
      }),
    });
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "secret:aabbccdd",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    expect(
      screen.queryByRole("dialog", {
        name: Label.GRANT_CONFIRM,
      }),
    ).not.toBeInTheDocument();
  });

  it("does not display a confirmation if the user can't manage secrets", async () => {
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({
            uri: "secret:aabbccdd",
          }),
        ],
        loaded: true,
      }),
    });
    state.juju.modelFeatures.abc123 = modelFeaturesFactory.build({
      manageSecrets: false,
    });
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "secret:aabbccdd",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    expect(
      screen.queryByRole("dialog", {
        name: Label.GRANT_CONFIRM,
      }),
    ).not.toBeInTheDocument();
  });

  it("can cancel the grant confirmation", async () => {
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({ access: [], uri: "secret:aabbccdd" }),
        ],
        loaded: true,
      }),
    });
    renderComponent(<ConfigPanel />, { state, path, url });
    expect(window.location.search).toBe(`?${params.toString()}`);
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "secret:aabbccdd",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.GRANT_CANCEL_BUTTON }),
    );
    expect(
      screen.queryByRole("dialog", {
        name: Label.GRANT_CONFIRM,
      }),
    ).not.toBeInTheDocument();
    expect(window.location.search).toBe("");
  });

  it("can grant secrets", async () => {
    const grantSecret = jest
      .fn()
      .mockImplementation(() => Promise.resolve({ results: [] }));
    jest
      .spyOn(secretHooks, "useGrantSecret")
      .mockImplementation(() => grantSecret);
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({ access: [], uri: "secret:aabbccdd" }),
          listSecretResultFactory.build({ access: [], uri: "secret:eeffgghh" }),
        ],
        loaded: true,
      }),
    });
    renderComponent(<ConfigPanel />, { state, path, url });
    expect(window.location.search).toBe(`?${params.toString()}`);
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "secret:aabbccdd",
    );
    await userEvent.type(
      within(await screen.findByTestId("name")).getByRole("textbox"),
      "secret:eeffgghh",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.GRANT_CONFIRM_BUTTON }),
    );
    expect(
      screen.queryByRole("dialog", {
        name: Label.GRANT_CONFIRM,
      }),
    ).not.toBeInTheDocument();
    expect(grantSecret).toHaveBeenCalledWith("secret:aabbccdd", ["easyrsa"]);
    expect(grantSecret).toHaveBeenCalledWith("secret:eeffgghh", ["easyrsa"]);
    expect(window.location.search).toBe("");
  });

  it("does not grant the same secret more than once", async () => {
    const grantSecret = jest
      .fn()
      .mockImplementation(() => Promise.resolve({ results: [] }));
    jest
      .spyOn(secretHooks, "useGrantSecret")
      .mockImplementation(() => grantSecret);
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({ access: [], uri: "secret:aabbccdd" }),
          listSecretResultFactory.build({ access: [], uri: "secret:eeffgghh" }),
        ],
        loaded: true,
      }),
    });
    renderComponent(<ConfigPanel />, { state, path, url });
    expect(window.location.search).toBe(`?${params.toString()}`);
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "secret:aabbccdd",
    );
    await userEvent.type(
      within(await screen.findByTestId("name")).getByRole("textbox"),
      "secret:aabbccdd",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.GRANT_CONFIRM_BUTTON }),
    );
    expect(
      screen.queryByRole("dialog", {
        name: Label.GRANT_CONFIRM,
      }),
    ).not.toBeInTheDocument();
    expect(grantSecret).toHaveBeenCalledTimes(1);
    expect(grantSecret).toHaveBeenCalledWith("secret:aabbccdd", ["easyrsa"]);
    expect(window.location.search).toBe("");
  });

  it("can handle errors when granting secrets", async () => {
    const grantSecret = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Error("Caught error")));
    jest
      .spyOn(secretHooks, "useGrantSecret")
      .mockImplementation(() => grantSecret);
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({ access: [], uri: "secret:aabbccdd" }),
        ],
        loaded: true,
      }),
    });
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "secret:aabbccdd",
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.SAVE_CONFIRM_CONFIRM_BUTTON }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: Label.GRANT_CONFIRM_BUTTON }),
    );
    expect(
      screen.queryByRole("dialog", {
        name: Label.GRANT_CONFIRM,
      }),
    ).not.toBeInTheDocument();
    expect(window.location.search).toBe(`?${params.toString()}`);
    await waitFor(() => {
      expect(
        document.querySelector(".p-notification--negative"),
      ).toHaveTextContent(Label.GRANT_ERROR);
    });
  });

  it("validates secret field URI format", async () => {
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({ access: [], uri: "secret:aabbccdd" }),
        ],
        loaded: true,
      }),
    });
    getApplicationConfig = jest.fn().mockImplementation(() =>
      Promise.resolve(
        applicationGetFactory.build({
          config: {
            email: configFactory.build({ default: "", type: "secret" }),
            name: configFactory.build({ default: "eggman" }),
          },
        }),
      ),
    );
    jest
      .spyOn(applicationHooks, "useGetApplicationConfig")
      .mockImplementation(() => getApplicationConfig);
    renderComponent(<ConfigPanel />, { state, path, url });
    const input = within(await screen.findByTestId("email")).getByRole(
      "textbox",
    );
    await userEvent.type(input, "notasecret:aabbccdd");
    expect(screen.getByText(Label.SECRET_PREFIX_ERROR)).toHaveClass(
      "p-form-validation__message",
    );
    expect(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    ).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, "secret:aabbccdd");
    expect(
      screen.queryByText(Label.SECRET_PREFIX_ERROR),
    ).not.toBeInTheDocument();
  });

  it("validates secret URIs exist", async () => {
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({ access: [], uri: "secret:aabbccdd" }),
        ],
        loaded: true,
      }),
    });
    renderComponent(<ConfigPanel />, { state, path, url });
    const input = within(await screen.findByTestId("email")).getByRole(
      "textbox",
    );
    await userEvent.type(input, "secret:nothing");
    expect(screen.getByText(Label.INVALID_SECRET_ERROR)).toHaveClass(
      "p-form-validation__message",
    );
    expect(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    ).toBeDisabled();
    await userEvent.clear(input);
    await userEvent.type(input, "secret:aabbccdd");
    expect(
      screen.queryByText(Label.INVALID_SECRET_ERROR),
    ).not.toBeInTheDocument();
  });

  it("validates secret URIs are not app-owned", async () => {
    state.juju.secrets = secretsStateFactory.build({
      abc123: modelSecretsFactory.build({
        items: [
          listSecretResultFactory.build({
            access: [],
            uri: "secret:aabbccdd",
            "owner-tag": "application-etcd",
          }),
        ],
        loaded: true,
      }),
    });
    renderComponent(<ConfigPanel />, { state, path, url });
    await userEvent.type(
      within(await screen.findByTestId("email")).getByRole("textbox"),
      "secret:aabbccdd",
    );
    expect(screen.getByText(Label.INVALID_SECRET_ERROR)).toHaveClass(
      "p-form-validation__message",
    );
    expect(
      screen.getByRole("button", { name: Label.SAVE_BUTTON }),
    ).toBeDisabled();
  });
});
