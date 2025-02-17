import type { JSX, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import "./_radio-input-box.scss";

type Props = {
  name: string;
  description: string;
  selectedInput?: string | undefined;
  onSelect: (inputName: string) => void;
  children: ReactNode;
};

export default function RadioInputBox({
  name,
  children,
  description,
  selectedInput,
  onSelect,
}: Props): JSX.Element {
  const [opened, setOpened] = useState<boolean>(false);
  const inputBoxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 20, 40 are magic numbers that align nicely with the heights.
  const initialHeight = 40;
  const paddingNumber = 20;

  useEffect(() => {
    if (inputBoxRef.current !== null) {
      // Due to the 'closed' hook animation running on initial load we cannot
      // set the initial height in the css but have to do it on the first load.
      inputBoxRef.current.style.height = initialHeight + "px";
    }
  }, [inputBoxRef]);

  useEffect(() => {
    setOpened(selectedInput === name);
  }, [selectedInput, name]);

  useEffect(() => {
    const wrapper = inputBoxRef.current;
    const container = containerRef.current;

    if (wrapper === null || container === null) return;

    let startHeight = 0;
    let endHeight = 0;
    let duration = 0;

    if (opened) {
      startHeight = wrapper.offsetHeight;
      // To be used when we're closing so we know what the original value was.
      endHeight = container.offsetHeight + paddingNumber;
      duration = endHeight;
      // Set the height of the wrapper element to the end height to
      // override the height set in css for the collapsed size.
      wrapper.style.height = endHeight + "px";
    } else if (wrapper.offsetHeight !== initialHeight) {
      // Do not animate if the wrapper height is already in the closed state
      // and this hook runs for the closed state again.
      endHeight = initialHeight;
      startHeight = container.offsetHeight + paddingNumber;
      duration = startHeight;
    }
    const animation = wrapper.animate(
      {
        height: [startHeight + "px", endHeight + "px"],
      },
      {
        // Set the duration to be the number of pixels that it has to animate
        // so that it's a consistent animation regardless of the height.
        duration,
        easing: "ease-out",
      },
    );

    animation.onfinish = () => {
      if (opened === false) {
        wrapper.style.height = initialHeight + "px";
      } else {
        wrapper.style.height = "";
      }
    };
  }, [opened, initialHeight]);

  const handleSelect = () => {
    onSelect(name);
    setOpened(true);
  };

  const labelId = `inputRadio-${name}`;

  return (
    <div className="radio-input-box" aria-expanded={opened} ref={inputBoxRef}>
      <div className="radio-input-box__container" ref={containerRef}>
        <label className="p-radio radio-input-box__label">
          <input
            type="radio"
            className="p-radio__input"
            name="inputRadioSelector"
            aria-labelledby={labelId}
            onClick={handleSelect}
            onChange={handleSelect}
          />
          <span className="p-radio__label" id={labelId}>
            {name}
          </span>
        </label>
        <div className="radio-input-box__content">
          <div className="radio-input-box__description">{description}</div>
          <div className="radio-input-box__options">{children}</div>
        </div>
      </div>
    </div>
  );
}
