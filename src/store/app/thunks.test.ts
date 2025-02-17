import { vi } from "vitest";

import { pollWhoamiStop } from "juju/jimm/listeners";
import { actions as appActions } from "store/app";
import { actions as generalActions } from "store/general";
import { AuthMethod } from "store/general/types";
import { actions as jujuActions } from "store/juju";
import type { RootState } from "store/store";
import { rootStateFactory } from "testing/factories";
import {
  credentialFactory,
  generalStateFactory,
  configFactory,
} from "testing/factories/general";
import {
  controllerFactory,
  jujuStateFactory,
} from "testing/factories/juju/juju";
import type { WindowConfig } from "types";

import { logOut, connectAndStartPolling } from "./thunks";

describe("thunks", () => {
  let state: RootState;

  beforeEach(() => {
    window.jujuDashboardConfig = {
      controllerAPIEndpoint: "wss://example.com/api",
    } as WindowConfig;
    fetchMock.resetMocks();
    state = rootStateFactory.build({
      general: generalStateFactory.build({
        config: configFactory.build({ isJuju: true }),
        controllerConnections: {
          "wss://example.com": {
            user: {
              "display-name": "eggman",
              identity: "user-eggman@external",
              "controller-access": "",
              "model-access": "",
            },
          },
        },
        credentials: { "wss://example.com": credentialFactory.build() },
      }),
      juju: jujuStateFactory.build({
        controllers: {
          "wss://example.com": [
            controllerFactory.build({
              path: "/",
              uuid: "uuid123",
              version: "1",
            }),
          ],
        },
      }),
    });
  });

  afterEach(() => {
    delete window.jujuDashboardConfig;
  });

  it("logOut", async () => {
    const action = logOut();
    const dispatch = vi.fn();
    const getState = vi.fn(() =>
      rootStateFactory.build({
        general: generalStateFactory.build({
          config: configFactory.build({ authMethod: AuthMethod.CANDID }),
        }),
      }),
    );
    await action(dispatch, getState, null);
    expect(dispatch).toHaveBeenCalledWith(jujuActions.clearModelData());
    expect(dispatch).toHaveBeenCalledWith(jujuActions.clearControllerData());
    expect(dispatch).toHaveBeenCalledWith(generalActions.logOut());
    const dispatchedThunk = await dispatch.mock.calls[4][0](
      dispatch,
      getState,
      null,
    );
    expect(dispatchedThunk.type).toBe("app/connectAndStartPolling/fulfilled");
  });

  it("logOut from OIDC", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({}), { status: 200 });
    const action = logOut();
    const dispatch = vi.fn();
    const getState = vi.fn(() =>
      rootStateFactory.build({
        general: generalStateFactory.build({
          config: configFactory.build({ authMethod: AuthMethod.OIDC }),
        }),
      }),
    );
    await action(dispatch, getState, null);
    expect(dispatch).toHaveBeenCalledWith(jujuActions.clearModelData());
    expect(dispatch).toHaveBeenCalledWith(jujuActions.clearControllerData());
    expect(dispatch).toHaveBeenCalledWith(generalActions.logOut());
    expect(dispatch).toHaveBeenCalledWith(pollWhoamiStop());
    const dispatchedThunk = await dispatch.mock.calls[5][0](
      dispatch,
      getState,
      null,
    );
    expect(dispatchedThunk.type).toBe("jimm/logout/fulfilled");
  });

  it("connectAndStartPolling", async () => {
    const dispatch = vi.fn();
    const getState = vi.fn(() => state);
    const action = connectAndStartPolling();
    await action(dispatch, getState, null);
    expect(dispatch).toHaveBeenCalledWith(
      appActions.connectAndPollControllers({
        controllers: [
          ["wss://controller.example.com", undefined, AuthMethod.LOCAL],
        ],
        isJuju: true,
      }),
    );
  });

  it("connectAndStartPolling should catch error instanceof Error", async () => {
    const dispatch = vi
      .fn()
      // Successfuly dispatch connectAndStartPolling/pending.
      .mockImplementationOnce(() => {})
      // Throw error when trying to dispatch connectAndPollControllers.
      .mockImplementationOnce(() => {
        throw "Error while dispatching connectAndPollControllers!";
      });
    const getState = vi.fn(() => state);
    const action = connectAndStartPolling();
    await action(dispatch, getState, null);
    expect(dispatch).toHaveBeenCalledWith(
      appActions.connectAndPollControllers({
        controllers: [
          ["wss://controller.example.com", undefined, AuthMethod.LOCAL],
        ],
        isJuju: true,
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      generalActions.storeConnectionError(
        "Unable to connect: Error while dispatching connectAndPollControllers!",
      ),
    );
  });

  it("connectAndStartPolling should catch string error", async () => {
    const dispatch = vi
      .fn()
      // Successfuly dispatch connectAndStartPolling/pending.
      .mockImplementationOnce(() => {})
      // Throw error when trying to dispatch connectAndPollControllers.
      .mockImplementationOnce(() => {
        throw new Error("Error while dispatching connectAndPollControllers!");
      });
    const getState = vi.fn(() => state);
    const action = connectAndStartPolling();
    await action(dispatch, getState, null);
    expect(dispatch).toHaveBeenCalledWith(
      appActions.connectAndPollControllers({
        controllers: [
          ["wss://controller.example.com", undefined, AuthMethod.LOCAL],
        ],
        isJuju: true,
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      generalActions.storeConnectionError(
        "Unable to connect: Error while dispatching connectAndPollControllers!",
      ),
    );
  });

  it("connectAndStartPolling should catch non-standard type of error", async () => {
    const dispatch = vi
      .fn()
      // Successfuly dispatch connectAndStartPolling/pending.
      .mockImplementationOnce(() => {})
      // Throw error when trying to dispatch connectAndPollControllers.
      .mockImplementationOnce(() => {
        throw ["Unknown error."];
      });
    const getState = vi.fn(() => state);
    const action = connectAndStartPolling();
    await action(dispatch, getState, null);
    expect(dispatch).toHaveBeenCalledWith(
      appActions.connectAndPollControllers({
        controllers: [
          ["wss://controller.example.com", undefined, AuthMethod.LOCAL],
        ],
        isJuju: true,
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      generalActions.storeConnectionError(
        "Unable to connect: Something went wrong. View the console log for more details.",
      ),
    );
  });
});
