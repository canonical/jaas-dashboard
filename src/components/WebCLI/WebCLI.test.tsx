import type { TSFixMe } from "@canonical/react-components";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { WS } from "jest-websocket-mock";
import cloneDeep from "clone-deep";

import bakery from "app/bakery";
import { RootState } from "store/store";
import dataDump from "testing/complete-redux-store-dump";

import WebCLI from "./WebCLI";

const mockStore = configureStore([]);

type Props = {
  protocol?: string;
  controllerWSHost: string;
  modelUUID: string;
  credentials: {
    user: string;
    password: string;
  } | null;
};

jest.mock("app/bakery", () => ({
  __esModule: true,
  default: {
    storage: {
      get: jest.fn(),
    },
  },
}));

describe("WebCLI", () => {
  const originalError = console.error;
  let bakerySpy: jest.SpyInstance;

  beforeEach(() => {
    bakerySpy = jest.spyOn(bakery.storage, "get");
  });

  afterEach(() => {
    bakerySpy.mockClear();
    // Reset the console.error to the original console.error in case
    // it was cobbered in a test.
    console.error = originalError;
  });

  /*
    Due to the setTimeout in the webCLI message buffer there doesn't appear
    to be a way to avoid all react `act` warnings in the tests that test
    the message handling.

    This method clobers the console.error for those tests so that we don't have
    to see the errors in the console.
  */
  const clobberConsoleError = () => {
    console.error = jest.fn();
  };

  async function generateComponent(
    props: Props = {
      controllerWSHost: "jimm.jujucharms.com:443",
      modelUUID: "abc123",
      credentials: null,
    },
    customDataDump?: RootState
  ) {
    const store = mockStore(customDataDump || dataDump);

    return render(
      <Provider store={store}>
        <WebCLI {...props} />
      </Provider>
    );
  }

  it("renders correctly", async () => {
    const { container } = await generateComponent();
    expect(container).toMatchSnapshot();
  });

  it("shows the help in the output when the ? is clicked", async () => {
    await generateComponent();
    await userEvent.click(screen.getByRole("button"));
    return new Promise((resolve) => setTimeout(resolve)).then(() => {
      expect(
        document.querySelector(".webcli__output-content code")
      ).toHaveTextContent(
        `Welcome to the Juju Web CLI - see the full documentation here.`
      );
    });
  });

  it("trims the command being submitted", async () => {
    const server = new WS("ws://localhost:1234/model/abc123/commands", {
      jsonProtocol: true,
    });
    await generateComponent({
      protocol: "ws",
      controllerWSHost: "localhost:1234",
      modelUUID: "abc123",
      credentials: {
        user: "spaceman",
        password: "somelongpassword",
      },
    });
    return new Promise<void>(async (resolve) => {
      await server.connected;
      const input = screen.getByRole("textbox");
      await userEvent.type(input, "      status       {enter}");
      await expect(server).toReceiveMessage({
        user: "spaceman",
        credentials: "somelongpassword",
        commands: ["status"],
      });
      setTimeout(() => {
        act(() => {
          WS.clean();
        });
        resolve();
      });
    });
  });

  it("supports macaroon based authentication", async () => {
    // TSFixMe: root is not currently typed.
    const clonedDataDump: TSFixMe = cloneDeep(dataDump);
    clonedDataDump.general.controllerConnections["ws://localhost:1234/api"] = {
      user: { identity: "user-eggman@external" },
    };
    bakerySpy.mockImplementation((key) => {
      const macaroons: Record<string, string> = {
        "ws://localhost:1234": "WyJtYWMiLCAiYXJvb24iXQo=",
      };
      return macaroons[key];
    });

    const server = new WS("ws://localhost:1234/model/abc123/commands", {
      jsonProtocol: true,
    });
    await generateComponent(
      {
        protocol: "ws",
        controllerWSHost: "localhost:1234",
        modelUUID: "abc123",
        credentials: null,
      },
      clonedDataDump
    );
    return new Promise<void>(async (resolve) => {
      await server.connected;
      const input = screen.getByRole("textbox");
      await userEvent.type(input, "      status       {enter}");
      await expect(server).toReceiveMessage({
        user: "eggman@external",
        macaroons: [["mac", "aroon"]],
        commands: ["status"],
      });
      setTimeout(() => {
        act(() => {
          WS.clean();
        });
        resolve();
      });
    });
  });

  describe("WebCLI Output", () => {
    it("displays messages recieved over the websocket", async () => {
      clobberConsoleError();
      // ..until it receives a 'done' message.
      const server = new WS("ws://localhost:1234/model/abc123/commands", {
        jsonProtocol: true,
      });
      await generateComponent({
        protocol: "ws",
        controllerWSHost: "localhost:1234",
        modelUUID: "abc123",
        credentials: {
          user: "spaceman",
          password: "somelongpassword",
        },
      });
      return new Promise<void>(async (resolve) => {
        await act(async () => {
          await server.connected;
          const input = screen.getByRole("textbox");
          await userEvent.type(input, "status --color{enter}");
          await expect(server).toReceiveMessage({
            user: "spaceman",
            credentials: "somelongpassword",
            commands: ["status --color"],
          });
        });

        const messages = [
          {
            output: [
              "Model       Controller       Cloud/Region     Version    SLA          Timestamp",
            ],
          },
          {
            output: [
              "controller  google-us-east1  google/us-east1  2.9-beta1  unsupported  17:44:14Z",
            ],
          },
          { output: [""] },
          {
            output: [
              "Machine  State    DNS             Inst id        Series  AZ          Message",
            ],
          },
          {
            output: [
              "0        started  35.190.153.209  juju-3686b9-0  focal   us-east1-b  RUNNING",
            ],
          },
          { output: [""] },
          { done: true },
        ];

        messages.forEach((message) => {
          // Due to the settimeout in the message buffer this causes intermittent react `act`
          // errors so this test has console.error clobbered to avoid looking at them.
          server.send(message);
        });

        setTimeout(() => {
          expect(
            document.querySelector(".webcli__output-content code")?.textContent
          ).toMatchSnapshot();
          expect(
            document.querySelector(".webcli__output-content")
          ).toHaveAttribute("style", "height: 300px;");
          act(() => {
            WS.clean();
          });
          resolve();
        });
      });
    });

    it("displays ansi colored content colored", async () => {
      clobberConsoleError();
      // ..until it receives a 'done' message.
      const server = new WS("ws://localhost:1234/model/abc123/commands", {
        jsonProtocol: true,
      });
      await generateComponent({
        protocol: "ws",
        controllerWSHost: "localhost:1234",
        modelUUID: "abc123",
        credentials: {
          user: "spaceman",
          password: "somelongpassword",
        },
      });
      return new Promise<void>(async (resolve) => {
        await act(async () => {
          await server.connected;
          const input = screen.getByRole("textbox");
          await userEvent.type(input, "status --color{enter}");
          await expect(server).toReceiveMessage({
            user: "spaceman",
            credentials: "somelongpassword",
            commands: ["status --color"],
          });
        });

        const messages = [
          {
            output: [
              "Model       Controller       Cloud/Region     Version    SLA          Timestamp",
            ],
          },
          {
            output: [
              "controller  google-us-east1  google/us-east1  2.9-beta1  unsupported  17:44:14Z",
            ],
          },
          { output: [""] },
          {
            output: [
              "Machine  State    DNS             Inst id        Series  AZ          Message",
            ],
          },
          {
            output: [
              "0        \u001b[32mstarted  \u001b[0m35.190.153.209  juju-3686b9-0  focal   us-east1-b  RUNNING",
            ],
          },
          { output: [""] },
          { done: true },
        ];

        messages.forEach((message) => {
          // Due to the settimeout in the message buffer this causes intermittent react `act`
          // errors so this test has console.error clobbered to avoid looking at them.
          server.send(message);
        });

        setTimeout(() => {
          expect(
            document.querySelector(".webcli__output-content code")?.textContent
          ).toMatchSnapshot();
          expect(
            document.querySelector(".webcli__output-content")
          ).toHaveAttribute("style", "height: 300px;");
          act(() => {
            WS.clean();
          });
          resolve();
        });
      });
    });
  });
});
