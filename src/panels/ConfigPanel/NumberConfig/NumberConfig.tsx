import type { JSX } from "react";

import type { ConfigProps } from "../ConfigField";
import ConfigField from "../ConfigField";

const NumberConfig = ({
  config,
  selectedConfig,
  setSelectedConfig,
  setNewValue,
  validate,
}: ConfigProps): JSX.Element => {
  return (
    <ConfigField<number>
      config={config}
      selectedConfig={selectedConfig}
      setSelectedConfig={setSelectedConfig}
      setNewValue={setNewValue}
      validate={validate}
      input={(value) => (
        <input
          type="number"
          value={value}
          onFocus={() => setSelectedConfig(config)}
          onChange={(e) => {
            setNewValue(config.name, e.target.value);
          }}
        />
      )}
    />
  );
};

export default NumberConfig;
