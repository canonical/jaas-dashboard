import classnames from "classnames";
import { useEffect, useRef, useState } from "react";

import { isSet } from "components/utils";

import { RadioInput } from "@canonical/react-components";
import type { ConfigProps } from "./ConfigPanel";

export default function BooleanConfig({
  config,
  selectedConfig,
  setSelectedConfig,
  setNewValue,
}: ConfigProps): JSX.Element {
  const [inputFocused, setInputFocused] = useState(false);
  const [inputChanged, setInputChanged] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showUseDefault, setShowUseDefault] = useState(
    config.value !== config.default
  );
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [maxDescriptionHeight, setMaxDescriptionHeight] = useState("0px");

  let inputValue = config.default;
  if (isSet(config.newValue)) {
    inputValue = config.newValue;
  } else if (config.default !== config.value) {
    inputValue = config.value;
  }

  useEffect(() => {
    if (descriptionRef.current?.firstChild) {
      setMaxDescriptionHeight(
        `${
          (descriptionRef.current.firstChild as HTMLPreElement).clientHeight
        }px`
      );
    }
  }, []);

  useEffect(() => {
    if (!descriptionRef.current) {
      return;
    }
    if (showDescription) {
      descriptionRef.current.style.maxHeight = maxDescriptionHeight;
    } else {
      descriptionRef.current.style.maxHeight = "0px";
    }
  }, [showDescription, maxDescriptionHeight]);

  useEffect(() => {
    if (selectedConfig?.name === config.name) {
      setInputFocused(true);
    } else {
      setInputFocused(false);
    }
  }, [selectedConfig, config]);

  useEffect(() => {
    if (
      (isSet(config.newValue) && config.newValue !== config.default) ||
      (!isSet(config.newValue) && config.value !== config.default)
    ) {
      setShowUseDefault(true);
    } else {
      setShowUseDefault(false);
    }

    if (isSet(config.newValue) && config.newValue !== config.value) {
      setInputChanged(true);
    } else {
      setInputChanged(false);
    }
  }, [config]);

  function handleOptionChange(e: any) {
    const bool = e.target.value === "true" ? true : false;
    setNewValue(e.target.name, bool);
  }

  function resetToDefault() {
    setNewValue(config.name, config.default);
  }

  return (
    // XXX How to tell aria to ignore the click but not the element?
    // eslint-disable-next-line
    <div
      className={classnames("config-input", {
        "config-input--focused": inputFocused,
        "config-input--changed": inputChanged,
      })}
      onClick={() => setSelectedConfig(config)}
    >
      <h5 className="u-float-left">
        <i
          className={classnames("config-input--view-description", {
            "p-icon--plus": !showDescription,
            "p-icon--minus": showDescription,
          })}
          onClick={() => setShowDescription(!showDescription)}
          onKeyPress={() => setShowDescription(!showDescription)}
          role="button"
          tabIndex={0}
        />
        {config.name}
      </h5>
      <button
        className={classnames(
          "u-float-right p-button--base config-panel__hide-button",
          {
            "config-panel__show-button": showUseDefault,
          }
        )}
        onClick={resetToDefault}
      >
        use default
      </button>
      <div
        className={classnames("config-input--description")}
        ref={descriptionRef}
      >
        <pre className="config-input--description-container">
          {config.description}
        </pre>
      </div>
      <div className="row">
        <div className="col-2">
          <RadioInput
            label="true"
            name={config.name}
            aria-labelledby={config.name}
            checked={inputValue === true}
            value="true"
            onClick={handleOptionChange}
            onChange={handleOptionChange}
          />
        </div>
        <div className="col-2">
          <RadioInput
            label="false"
            name={config.name}
            aria-labelledby={config.name}
            checked={inputValue === false}
            value="false"
            onClick={handleOptionChange}
            onChange={handleOptionChange}
          />
        </div>
      </div>
    </div>
  );
}
