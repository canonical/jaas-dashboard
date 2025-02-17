import { Notification } from "@canonical/react-components";
import type { JSX, ReactNode } from "react";

import ScrollOnRender from "components/ScrollOnRender";

type Props = {
  inlineErrors: ReactNode[] | null;
  scrollArea?: HTMLElement | null;
};

const PanelInlineErrors = ({
  inlineErrors,
  scrollArea,
}: Props): JSX.Element | null =>
  inlineErrors && inlineErrors.some((error) => !!error) ? (
    <ScrollOnRender scrollArea={scrollArea}>
      {inlineErrors.map((error, index) =>
        error ? (
          <Notification key={index} severity="negative">
            {error}
          </Notification>
        ) : null,
      )}
    </ScrollOnRender>
  ) : null;

export default PanelInlineErrors;
