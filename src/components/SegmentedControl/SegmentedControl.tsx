import type { ButtonProps } from "@canonical/react-components";
import { Button, type PropsWithSpread } from "@canonical/react-components";
import classNames from "classnames";
import type { ComponentType, ElementType, HTMLProps, JSX } from "react";

type Props<P = ButtonProps> = PropsWithSpread<
  {
    buttons: ({ key: string } & P)[];
    buttonComponent?: ElementType | ComponentType<P>;
    activeButton?: string | null;
  },
  HTMLProps<HTMLDivElement>
>;

const SegmentedControl = <P,>({
  buttons,
  buttonComponent,
  activeButton,
  className,
  ...props
}: Props<P>): JSX.Element => {
  return (
    <div className={classNames("p-segmented-control", className)} {...props}>
      <div className="p-segmented-control__list" role="tablist">
        {buttons.map(({ key, ...buttonProps }) => (
          <Button
            element={buttonComponent}
            key={key}
            className="p-segmented-control__button u-no-margin"
            role="tab"
            aria-selected={activeButton === key}
            {...buttonProps}
          />
        ))}
      </div>
    </div>
  );
};

export default SegmentedControl;
