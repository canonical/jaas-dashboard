import {
  CodeSnippet,
  CodeSnippetBlockAppearance,
  Spinner,
} from "@canonical/react-components";
import { useEffect, useState } from "react";
import type { ValueRenderer } from "react-json-tree";
import { JSONTree } from "react-json-tree";

import Status from "components/Status";
import { actions as jujuActions } from "store/juju";
import {
  getCrossModelQueryLoaded,
  getCrossModelQueryLoading,
  getCrossModelQueryResults,
} from "store/juju/selectors";
import { useAppDispatch, useAppSelector } from "store/store";

import "./_results-block.scss";

export enum TestId {
  LOADING = "loading",
}

enum CodeSnippetView {
  TREE = "tree",
  JSON = "json",
}

const DEFAULT_THEME_COLOUR = "#00000099";

const THEME = {
  scheme: "Vanilla",
  base00: "#00000000",
  base01: DEFAULT_THEME_COLOUR,
  base02: DEFAULT_THEME_COLOUR,
  base03: DEFAULT_THEME_COLOUR,
  base04: DEFAULT_THEME_COLOUR,
  base05: DEFAULT_THEME_COLOUR,
  base06: DEFAULT_THEME_COLOUR,
  base07: "#000000",
  base08: "#a86500",
  base09: "#c7162b",
  base0A: DEFAULT_THEME_COLOUR,
  base0B: "#0e811f",
  base0C: DEFAULT_THEME_COLOUR,
  base0D: "#000000",
  base0E: DEFAULT_THEME_COLOUR,
  base0F: DEFAULT_THEME_COLOUR,
};

const valueRenderer: ValueRenderer = (valueAsString, value, ...keyPath) => {
  const currentKey = keyPath[0];
  const parentKey = keyPath.length >= 2 ? keyPath[1] : null;
  // Match a status of the following structure:
  //   "application-status": {
  //     "current": "unknown",
  //     ...
  //   }
  if (
    currentKey === "current" &&
    typeof parentKey === "string" &&
    parentKey.endsWith("-status") &&
    typeof value === "string" &&
    typeof valueAsString === "string"
  ) {
    return <Status status={value}>{valueAsString}</Status>;
  }
  return <>{valueAsString}</>;
};

const ResultsBlock = (): JSX.Element | null => {
  const dispatch = useAppDispatch();
  const isCrossModelQueryLoading = useAppSelector(getCrossModelQueryLoading);
  const isCrossModelQueryLoaded = useAppSelector(getCrossModelQueryLoaded);
  const crossModelQueryResults = useAppSelector(getCrossModelQueryResults);
  const [codeSnippetView, setCodeSnippetView] = useState<CodeSnippetView>(
    CodeSnippetView.TREE
  );
  const resultsJSON = JSON.stringify(crossModelQueryResults, null, 2);

  useEffect(
    () => () => {
      // Clear cross-model query results when component is unmounted.
      dispatch(jujuActions.clearCrossModelQuery());
    },
    [dispatch]
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

  if (!isCrossModelQueryLoaded) {
    return null;
  }

  return (
    <>
      <CodeSnippet
        className="results-block"
        blocks={[
          {
            appearance:
              codeSnippetView === CodeSnippetView.JSON
                ? CodeSnippetBlockAppearance.NUMBERED
                : undefined,
            code:
              codeSnippetView === CodeSnippetView.JSON ? (
                resultsJSON
              ) : (
                <JSONTree
                  data={crossModelQueryResults}
                  hideRoot
                  shouldExpandNodeInitially={(_keyPath, _data, level) =>
                    level <= 2
                  }
                  theme={THEME}
                  valueRenderer={valueRenderer}
                />
              ),
            dropdowns: [
              {
                options: [
                  {
                    value: CodeSnippetView.TREE,
                    label: "Tree",
                  },
                  {
                    value: CodeSnippetView.JSON,
                    label: "JSON",
                  },
                ],
                value: codeSnippetView,
                onChange: (event) => {
                  setCodeSnippetView(
                    (event.target as HTMLSelectElement).value as CodeSnippetView
                  );
                },
              },
            ],
          },
        ]}
      />
    </>
  );
};

export default ResultsBlock;
