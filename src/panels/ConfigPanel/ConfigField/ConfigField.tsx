import { Button, Icon } from "@canonical/react-components";
import classnames from "classnames";
import classNames from "classnames";
import type { JSX, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DivButton from "components/DivButton";
import TruncatedTooltip from "components/TruncatedTooltip";
import { isSet } from "components/utils";

import type { ConfigData, ConfigValue } from "../types";

import { Label } from "./types";

export type SetNewValue = (name: string, value: ConfigValue) => void;

export type SetSelectedConfig = (config: ConfigData) => void;

export type ConfigProps = {
  config: ConfigData;
  selectedConfig: ConfigData | undefined;
  setSelectedConfig: SetSelectedConfig;
  setNewValue: SetNewValue;
  validate?: (config: ConfigData) => void;
};

type Props<V extends ConfigValue> = ConfigProps & {
  input: (value: V) => ReactNode;
};

const ConfigField = <V extends ConfigValue>({
  config,
  input,
  selectedConfig,
  setSelectedConfig,
  setNewValue,
  validate,
}: Props<V>): JSX.Element => {
  const [inputFocused, setInputFocused] = useState(false);
  const [inputChanged, setInputChanged] = useState(false);
  const [showUseDefault, setShowUseDefault] = useState(
    config.value !== config.default,
  );
  const [showDescription, setShowDescription] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [maxDescriptionHeight, setMaxDescriptionHeight] = useState<string>();
  const previousValue = useRef<Props<V>["config"]["newValue"]>(null);
  const valueChanged = config.newValue !== previousValue.current;

  let inputValue = config.default;
  if (isSet(config.newValue)) {
    inputValue = config.newValue;
  } else if (config.default !== config.value) {
    inputValue = config.value;
  }

  const updateDescriptionHeight = useCallback(() => {
    if (
      // Don't update if the height has already been retrieved.
      !maxDescriptionHeight &&
      descriptionRef.current?.firstChild &&
      // Don't try and update if the element is not visible.
      descriptionRef.current?.offsetParent !== null
    ) {
      setMaxDescriptionHeight(
        `${
          (descriptionRef.current.firstChild as HTMLPreElement).clientHeight
        }px`,
      );
    }
  }, [maxDescriptionHeight]);

  const resizeObserver = useMemo(
    () => new ResizeObserver(updateDescriptionHeight),
    [updateDescriptionHeight],
  );

  useEffect(() => {
    if (maxDescriptionHeight) {
      // There's no need to keep observing the element once the height has
      // been retrieved.
      resizeObserver.disconnect();
    }
  }, [maxDescriptionHeight, resizeObserver]);

  useEffect(() => {
    const descriptionElement = descriptionRef.current;
    if (!descriptionElement) {
      return;
    }
    // Attempt to set the height if the element is visible.
    updateDescriptionHeight();
    // On larger screens the description is hidden so the element needs to be
    // observed for when the screen is resized down and it becomes visible so
    // that the height can be retrieved.
    resizeObserver.observe(descriptionElement);
    return () => {
      if (descriptionElement) {
        resizeObserver.unobserve(descriptionElement);
      }
    };
  }, [updateDescriptionHeight, resizeObserver]);

  useEffect(() => {
    if (!descriptionRef.current) {
      return;
    }
    if (showDescription) {
      descriptionRef.current.style.maxHeight = maxDescriptionHeight ?? "0px";
    } else {
      descriptionRef.current.style.maxHeight = "0px";
    }
  }, [showDescription, maxDescriptionHeight]);

  useEffect(() => {
    setInputFocused(selectedConfig?.name === config.name);
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

  useEffect(() => {
    if (validate && valueChanged) {
      validate(config);
    }
    previousValue.current = config.newValue;
  }, [config, validate, valueChanged]);

  function resetToDefault() {
    setNewValue(config.name, config.default);
  }

  function handleShowDescription() {
    setShowDescription(!showDescription);
  }

  return (
    <DivButton
      className={classnames("config-input", {
        "config-input--focused": inputFocused,
        "config-input--changed": inputChanged,
      })}
      data-testid={config.name}
      onClick={() => {
        setSelectedConfig(config);
      }}
    >
      <div className="config-input__title">
        {config.description ? (
          <Button
            aria-label={Label.TOGGLE_DESCRIPTION}
            appearance="base"
            className="config-input--view-description"
            onClick={handleShowDescription}
          >
            <Icon name={showDescription ? "minus" : "plus"} />
          </Button>
        ) : null}
        <h5 className="u-truncate u-flex-grow">
          <TruncatedTooltip message={config.name}>
            {config.name}
          </TruncatedTooltip>
        </h5>
        <button
          className={classnames("p-button--base config-panel__hide-button", {
            "config-panel__show-button": showUseDefault,
          })}
          onClick={resetToDefault}
          tabIndex={showUseDefault ? 0 : -1}
          aria-hidden={!showUseDefault}
        >
          {Label.DEFAULT_BUTTON}
        </button>
      </div>
      <div
        className={classnames("config-input--description")}
        ref={descriptionRef}
      >
        <pre className="config-input--description-container">
          {config.description}
        </pre>
      </div>
      <div
        className={classNames("p-form-validation", {
          "is-error": !!config.error,
        })}
      >
        {input(inputValue as V)}
        {config.error ? (
          <p className="p-form-validation__message">{config.error}</p>
        ) : null}
      </div>
    </DivButton>
  );
};

export default ConfigField;
