import { Button } from "@canonical/react-components";
import type { JSX } from "react";

type Props = {
  handleQuery: (query: string) => Promise<void>;
  query: string;
};

const QueryLink = ({ handleQuery, query }: Props): JSX.Element => {
  return (
    <Button
      appearance="link"
      className="u-no-margin u-no-padding u-align--left p-text--small"
      onClick={async () => await handleQuery(query)}
      type="button"
    >
      <code>{query}</code>
    </Button>
  );
};

export default QueryLink;
