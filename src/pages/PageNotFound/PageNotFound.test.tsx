import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import configureStore from "redux-mock-store";

import { Routes } from "components/Routes/Routes";
import { rootStateFactory } from "testing/factories/root";

import { TestId } from "../../layout/BaseLayout/BaseLayout";

import { Label } from "./PageNotFound";

const mockStore = configureStore([]);

describe("PageNotFound page", () => {
  it("should display when unknown route is accessed", () => {
    const store = mockStore(rootStateFactory.withGeneralConfig().build());
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/foobar11"]}>
          <Routes />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(Label.NOT_FOUND)).toBeInTheDocument();
    // Ensure only one route is rendered
    expect(screen.getAllByTestId(TestId.MAIN)).toHaveLength(1);
  });
});
