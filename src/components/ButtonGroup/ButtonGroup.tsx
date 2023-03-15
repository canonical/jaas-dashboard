import classNames from "classnames";

import "./_button-group.scss";

export enum TestId {
  LABEL = "label",
}

type Props = {
  buttons: string[];
  label?: string;
  noWrap?: boolean;
  activeButton: string;
  setActiveButton: (value: string) => void;
};

const ButtonGroup = ({
  buttons,
  label,
  noWrap,
  activeButton,
  setActiveButton,
}: Props): JSX.Element => {
  return (
    <div className="p-button-group">
      <div className="p-button-group__inner">
        {label ? (
          <span
            className={classNames("p-button-group__label", {
              "p-button-group__label--fixed": noWrap,
            })}
            data-testid={TestId.LABEL}
          >
            {label}
          </span>
        ) : null}
        <div className="p-button-group__buttons">
          {buttons.map((label) => (
            <button
              aria-label={`view by ${label}`}
              key={label}
              className={classNames("p-button-group__button", {
                "is-selected": activeButton === label,
              })}
              value={label}
              onClick={(e) => setActiveButton(e.currentTarget.value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ButtonGroup;
