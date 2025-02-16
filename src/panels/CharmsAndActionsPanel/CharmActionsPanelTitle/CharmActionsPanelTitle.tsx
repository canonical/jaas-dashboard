import type { JSX } from "react";
import { useSelector } from "react-redux";

import CharmIcon from "components/CharmIcon";
import {
  getSelectedApplications,
  getSelectedCharm,
} from "store/juju/selectors";
import { pluralize } from "store/juju/utils/models";

import { Label } from "./types";

type Props = {
  charmURL: string;
};

const CharmActionsPanelTitle = ({ charmURL }: Props): JSX.Element => {
  const selectedApplications = useSelector(getSelectedApplications(charmURL));
  const selectedCharm = useSelector(getSelectedCharm(charmURL));

  if (!selectedApplications.length || !selectedCharm)
    return <>{Label.NONE_SELECTED_TITLE}</>;
  const totalUnits = selectedApplications.reduce(
    (total, app) => total + (app["unit-count"] || 0),
    0,
  );

  return (
    <>
      {selectedCharm?.meta?.name && selectedCharm?.url ? (
        <CharmIcon name={selectedCharm.meta.name} charmId={selectedCharm.url} />
      ) : null}{" "}
      {selectedApplications.length}{" "}
      {pluralize(selectedApplications.length, "application")} ({totalUnits}{" "}
      {pluralize(totalUnits, "unit")}) selected
    </>
  );
};

export default CharmActionsPanelTitle;
