import {
  CodeSnippet,
  CodeSnippetBlockAppearance,
} from "@canonical/react-components";
import { Highlight } from "prism-react-renderer";
import Prism from "prismjs/components/prism-core";
import type { JSX } from "react";
import { useState } from "react";
import { JSONTree } from "react-json-tree";
import "prismjs/components/prism-json";

import { type CrossModelQueryResponse } from "juju/jimm/JIMMV4";

import { CodeSnippetView } from "../types";

import Label from "./Label";
import Value from "./Value";

type Props = {
  className: string;
  title: string;
  code: CrossModelQueryResponse["results"] | CrossModelQueryResponse["errors"];
};

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
  base0D: "#77216f",
  base0E: DEFAULT_THEME_COLOUR,
  base0F: DEFAULT_THEME_COLOUR,
};

const CodeSnippetBlock = ({ className, title, code }: Props): JSX.Element => {
  const [codeSnippetView, setCodeSnippetView] = useState<CodeSnippetView>(
    CodeSnippetView.TREE,
  );

  return (
    <Highlight
      code={JSON.stringify(code, null, 2)}
      language="json"
      prism={Prism}
    >
      {({ tokens, getLineProps, getTokenProps }) => (
        <CodeSnippet
          className={className}
          blocks={[
            {
              title,
              appearance:
                codeSnippetView === CodeSnippetView.JSON
                  ? CodeSnippetBlockAppearance.NUMBERED
                  : undefined,
              code:
                codeSnippetView === CodeSnippetView.JSON ? (
                  tokens.map((line, i) => {
                    const { style: _style, ...lineProps } = getLineProps({
                      line,
                    });
                    return (
                      <span key={i} {...lineProps}>
                        {line.map((token, key) => {
                          const { style: _style, ...tokenProps } =
                            getTokenProps({
                              token,
                            });
                          return <span key={key} {...tokenProps} />;
                        })}
                      </span>
                    );
                  })
                ) : (
                  <JSONTree
                    data={code}
                    hideRoot
                    labelRenderer={(keyPath) => <Label keyPath={keyPath} />}
                    shouldExpandNodeInitially={(_keyPath, _data, level) =>
                      level <= 2
                    }
                    theme={THEME}
                    valueRenderer={(valueAsString, value, ...keyPath) => (
                      <Value
                        valueAsString={valueAsString}
                        value={value}
                        keyPath={keyPath}
                        code={code}
                      />
                    )}
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
                      (event.target as HTMLSelectElement)
                        .value as CodeSnippetView,
                    );
                  },
                },
              ],
            },
          ]}
        />
      )}
    </Highlight>
  );
};

export default CodeSnippetBlock;
