import type { JSX } from "react";
import { type PropsWithChildren } from "react";
import { Link } from "react-router";

import { useModelByUUIDDetails } from "components/hooks";
import urls from "urls";

type Props = {
  uuid: string;
  appName: string;
  unitId: string;
} & PropsWithChildren;

const UnitLink = ({ uuid, appName, unitId, children }: Props): JSX.Element => {
  const { userName, modelName } = useModelByUUIDDetails({ uuid });

  // If at least one of the bellow values is falsy, we can't form a valid Link.
  if (!userName || !modelName || !appName || !unitId) {
    return <>{children}</>;
  }

  return (
    <Link
      // Prevent toggling the object when the link is clicked.
      onClick={(event) => event.stopPropagation()}
      to={urls.model.unit({ userName, modelName, appName, unitId })}
    >
      {children}
    </Link>
  );
};

export default UnitLink;
