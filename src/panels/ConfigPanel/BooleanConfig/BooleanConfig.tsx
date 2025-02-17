import { RadioInput } from "@canonical/react-components";
import type { FormEvent, JSX, MouseEvent } from "react";

import type { ConfigProps } from "../ConfigField";
import ConfigField from "../ConfigField";

export default function BooleanConfig({
  config,
  selectedConfig,
  setSelectedConfig,
  setNewValue,
  validate,
}: ConfigProps): JSX.Element {
  function handleOptionChange(
    e: FormEvent<HTMLInputElement> | MouseEvent<HTMLInputElement>,
  ) {
    const target = e.target as HTMLInputElement;
    const bool = target.value === "true" ? true : false;
    setNewValue(target.name, bool);
  }

  return (
    <ConfigField<boolean>
      config={config}
      selectedConfig={selectedConfig}
      setSelectedConfig={setSelectedConfig}
      setNewValue={setNewValue}
      validate={validate}
      input={(value) => (
        <div className="u-flex u-flex--gap">
          <div>
            <RadioInput
              label="true"
              name={config.name}
              aria-labelledby={config.name}
              checked={value === true}
              value="true"
              onClick={handleOptionChange}
              onChange={handleOptionChange}
            />
          </div>
          <div>
            <RadioInput
              label="false"
              name={config.name}
              aria-labelledby={config.name}
              checked={value === false}
              value="false"
              onClick={handleOptionChange}
              onChange={handleOptionChange}
            />
          </div>
        </div>
      )}
    />
  );
}
