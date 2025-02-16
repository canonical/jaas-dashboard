import type { JSX } from "react";
import { useRef } from "react";

import type { ConfigProps } from "../ConfigField";
import ConfigField from "../ConfigField";
import SecretsPicker from "../SecretsPicker";

export default function TextAreaConfig({
  config,
  selectedConfig,
  setSelectedConfig,
  setNewValue,
  validate,
}: ConfigProps): JSX.Element {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <ConfigField<string>
      config={config}
      selectedConfig={selectedConfig}
      setSelectedConfig={setSelectedConfig}
      setNewValue={setNewValue}
      validate={validate}
      input={(value) => (
        <div className="u-flex">
          <textarea
            ref={inputRef}
            value={value ?? ""}
            onFocus={() => setSelectedConfig(config)}
            onChange={(e) => {
              setNewValue(config.name, e.target.value);
            }}
          ></textarea>
          <SecretsPicker
            setValue={(secret) => setNewValue(config.name, secret)}
          />
        </div>
      )}
    />
  );
}
