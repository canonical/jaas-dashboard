import type { PropsWithSpread } from "@canonical/react-components";
import type { JSX, PropsWithChildren } from "react";

import ModelDetailsLink from "components/ModelDetailsLink";
import type {
  Props as ModelDetailsLinkProps,
  UUIDProps,
} from "components/ModelDetailsLink/ModelDetailsLink";

type Props = PropsWithSpread<
  UUIDProps & PropsWithChildren,
  ModelDetailsLinkProps
>;

const ResultsModelLink = ({
  children,
  uuid,
  ...props
}: Props): JSX.Element | null => {
  return (
    <ModelDetailsLink
      // Prevent toggling the object when the link is clicked.
      onClick={(event) => event.stopPropagation()}
      uuid={uuid}
      {...props}
    >
      {children}:
    </ModelDetailsLink>
  );
};

export default ResultsModelLink;
