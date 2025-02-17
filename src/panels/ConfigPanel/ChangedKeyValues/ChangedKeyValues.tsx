import type { JSX, ReactNode } from "react";

import { isSet } from "components/utils";

import type { Config, ConfigData } from "../types";

type Props = {
  appName: string;
  config: Config;
};

const generateValue = (config: ConfigData) => {
  if (config.type === "boolean") {
    return config.newValue ? "true" : "false";
  }
  return config.newValue;
};

const ChangedKeyValues = ({ appName, config }: Props): JSX.Element => {
  const changedValues = Object.entries(config).reduce(
    (accumulator: ReactNode[], [key, configData]) => {
      if (
        isSet(configData.newValue) &&
        configData.newValue !== configData.value
      ) {
        accumulator.push(
          <div key={key}>
            <h5>{key}</h5>
            <pre>{generateValue(configData)}</pre>
          </div>,
        );
      }
      return accumulator;
    },
    [],
  );
  return (
    <>
      <p>
        You have edited the following values to the {appName} configuration:
      </p>
      {changedValues}
    </>
  );
};

export default ChangedKeyValues;
