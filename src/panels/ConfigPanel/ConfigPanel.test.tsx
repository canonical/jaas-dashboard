import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import configureStore from "redux-mock-store";
import { Provider } from "react-redux";
import dataDump from "testing/complete-redux-store-dump";
import configResponse from "testing/config-response";

import { getApplicationConfig } from "juju";

import ConfigPanel, { Label } from "./ConfigPanel";

const mockStore = configureStore([]);

jest.mock("juju/index", () => ({
  getApplicationConfig: jest.fn(),
}));

describe("ConfigPanel", () => {
  beforeEach(() => jest.resetModules());

  it("displays a message if the app has no config", async () => {
    (getApplicationConfig as jest.Mock).mockImplementation(() => {
      return Promise.resolve({ config: {} });
    });
    const store = mockStore(dataDump);
    render(
      <Provider store={store}>
        <ConfigPanel
          appName="easyrsa"
          charm="cs:easyrsa"
          modelUUID=""
          onClose={() => {}}
        />
      </Provider>
    );
    // Use findBy to wait for the async events to finish
    await screen.findByText(Label.NONE);
    expect(document.querySelector(".config-panel__message")).toMatchSnapshot();
  });

  it("highlights changed fields before save", async () => {
    (getApplicationConfig as jest.Mock).mockImplementation(() => {
      return Promise.resolve(configResponse);
    });
    const store = mockStore(dataDump);
    render(
      <Provider store={store}>
        <ConfigPanel
          appName="easyrsa"
          charm="cs:easyrsa"
          modelUUID=""
          onClose={() => {}}
        />
      </Provider>
    );

    const wrapper = await screen.findByTestId("custom-registry-ca");
    const input = within(wrapper).getByRole("textbox");
    await userEvent.type(input, "new value");
    expect(input).toHaveTextContent("new value");
    expect(wrapper).toHaveClass("config-input--changed");
  });
});
