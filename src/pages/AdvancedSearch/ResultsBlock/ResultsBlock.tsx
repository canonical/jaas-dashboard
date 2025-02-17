import { Spinner } from "@canonical/react-components";
import type { JSX } from "react";
import { useEffect } from "react";

import { actions as jujuActions } from "store/juju";
import {
  getCrossModelQueryErrors,
  getCrossModelQueryLoaded,
  getCrossModelQueryLoading,
  getCrossModelQueryResults,
} from "store/juju/selectors";
import { useAppDispatch, useAppSelector } from "store/store";

import CodeSnippetBlock from "../CodeSnippetBlock/CodeSnippetBlock";

import "./_results-block.scss";
import { Label, TestId } from "./types";

const ResultsBlock = (): JSX.Element | null => {
  const dispatch = useAppDispatch();
  const isCrossModelQueryLoading = useAppSelector(getCrossModelQueryLoading);
  const isCrossModelQueryLoaded = useAppSelector(getCrossModelQueryLoaded);
  const crossModelQueryResults = useAppSelector(getCrossModelQueryResults);
  const crossModelQueryErrors = useAppSelector(getCrossModelQueryErrors);

  useEffect(
    () => () => {
      // Clear cross-model query results when component is unmounted.
      dispatch(jujuActions.clearCrossModelQuery());
    },
    [dispatch],
  );

  // The loading state needs to be first so that it appears even if the results
  // have never loaded.
  if (isCrossModelQueryLoading) {
    return (
      <div className="u-align--center">
        <div className="u-sv3">
          <hr />
        </div>
        <Spinner data-testid={TestId.LOADING} />
      </div>
    );
  }

  if (!isCrossModelQueryLoaded || !!crossModelQueryErrors) {
    return null;
  }

  // Display a message if there are no results. The JQ filter is applied per
  // model, so it could return null for every model, in which case this displays
  // a single message.
  if (
    !crossModelQueryResults ||
    Object.values(crossModelQueryResults).every((resultArray) =>
      resultArray.every((result) => result === null),
    )
  ) {
    return (
      <div className="results-block">
        <hr />
        <p>{Label.NO_RESULTS}</p>
      </div>
    );
  }

  return (
    <CodeSnippetBlock
      title="Results"
      className="results-block"
      code={crossModelQueryResults}
    />
  );
};

export default ResultsBlock;
