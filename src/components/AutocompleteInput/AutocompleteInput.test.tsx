import { screen } from "@testing-library/react";

import { renderComponent } from "testing/utils";

import AutocompleteInput from "./AutocompleteInput";

describe("AutocompleteInput", () => {
  it("should display the input and options", () => {
    renderComponent(
      <AutocompleteInput
        options={["option1", { label: "Option Two", value: "option2" }]}
      />
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "", hidden: true })
    ).toHaveAttribute("value", "option1");
    expect(
      screen.getByRole("option", { name: "Option Two", hidden: true })
    ).toHaveAttribute("value", "option2");
  });

  it("should skip displaying option that is not a string or instance of Option", () => {
    renderComponent(
      <AutocompleteInput
        options={[
          "option1",
          { label: "Option Two", value: "option2" },
          undefined,
        ]}
      />
    );
    expect(screen.getAllByRole("option", { hidden: true })).toHaveLength(2);
    expect(
      screen.getByRole("option", { name: "", hidden: true })
    ).toHaveAttribute("value", "option1");
    expect(
      screen.getByRole("option", { name: "Option Two", hidden: true })
    ).toHaveAttribute("value", "option2");
  });
});
