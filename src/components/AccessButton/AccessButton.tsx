import { Button, Icon } from "@canonical/react-components";
import { Link } from "react-router";

import { useQueryParams } from "hooks/useQueryParams";
import { getIsJuju } from "store/general/selectors";
import { useAppSelector } from "store/store";
import { rebacURLS } from "urls";

import type { Props } from "./types";

const AccessButton = ({
  children,
  displayIcon,
  modelName,
  ...props
}: Props) => {
  const isJuju = useAppSelector(getIsJuju);
  const [, setPanelQs] = useQueryParams<{
    model: string | null;
    panel: string | null;
  }>({
    model: null,
    panel: null,
  });
  return (
    <Button
      {...props}
      {...(isJuju
        ? {
            onClick: (event) => {
              event.stopPropagation();
              setPanelQs(
                {
                  model: modelName,
                  panel: "share-model",
                },
                { replace: true },
              );
            },
          }
        : {
            element: Link,
            to: rebacURLS.groups.index,
          })}
      hasIcon={displayIcon}
    >
      {displayIcon ? <Icon name="share" /> : null}
      <span>{children}</span>
    </Button>
  );
};

export default AccessButton;
