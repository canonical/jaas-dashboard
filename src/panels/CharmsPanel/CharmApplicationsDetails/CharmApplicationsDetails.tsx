import { Tooltip } from "@canonical/react-components";
import type { JSX } from "react";

import type { ApplicationInfo } from "juju/types";
import { getSelectedApplications } from "store/juju/selectors";
import { useAppSelector } from "store/store";
import { breakLines } from "utils";

type Props = {
  charmURL: string;
};

const formatApplicationsDetails = (applications: ApplicationInfo[]) =>
  applications
    .map((application) => ("name" in application ? application.name : null))
    .filter((application) => !!application)
    .join(", ");

const CharmApplicationsDetails = ({ charmURL }: Props): JSX.Element => {
  const selectedApplications = useAppSelector(
    getSelectedApplications(charmURL),
  );
  const displayedApplications = selectedApplications.slice(0, 5);
  const hiddenApplications = selectedApplications.slice(5);

  return (
    <p className="p-form-help-text is-tick-element">
      {formatApplicationsDetails(displayedApplications)}
      {hiddenApplications.length ? (
        <>
          {" + "}
          <Tooltip
            tooltipClassName="p-tooltip--fixed-width"
            // Insert line breaks into the tooltip so that the content wraps
            // instead of appearing as one long line.
            message={breakLines(formatApplicationsDetails(hiddenApplications))}
            position="btm-center"
          >
            <u>{hiddenApplications.length} more</u>
          </Tooltip>
        </>
      ) : null}
    </p>
  );
};

export default CharmApplicationsDetails;
