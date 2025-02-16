import { useFormikContext } from "formik";
import type { JSX } from "react";

import QueryLink from "../QueryLink";
import type { FormFields } from "../types";

type Props = {
  search: (query: string) => void;
};

const SearchHelp = ({ search }: Props): JSX.Element => {
  const { setFieldValue } = useFormikContext<FormFields>();

  const handleQuery = async (query: string) => {
    await setFieldValue("query", query);
    search(query);
  };

  return (
    <>
      <p className="p-form-help-text u-no-margin--top">
        Search all models using the{" "}
        <a
          href="https://jqlang.github.io/jq/"
          rel="noopener noreferrer"
          target="_blank"
        >
          JQ
        </a>{" "}
        syntax. To see the JSON that is queried you can use the CLI to run{" "}
        <code>juju status --format json</code> or search for{" "}
        <QueryLink query="." handleQuery={handleQuery} /> to return the
        unmodified output for all models.
      </p>
      <div className="u-hide u-show--large">
        <p className="p-form-help-text">Examples:</p>
        <ul className="p-form-help-text">
          <li>
            Get all applications:{" "}
            <QueryLink query=".applications" handleQuery={handleQuery} />
          </li>
          <li>
            Get all available models:{" "}
            <QueryLink
              query={`. | select(.model."model-status".current=="available")`}
              handleQuery={handleQuery}
            />
          </li>
          <li>
            Get all models that contain an application named postgresql:{" "}
            <QueryLink
              query={`select(.applications | to_entries[] | select(.key=="postgresql")) | .`}
              handleQuery={handleQuery}
            />
          </li>
        </ul>
      </div>
    </>
  );
};

export default SearchHelp;
