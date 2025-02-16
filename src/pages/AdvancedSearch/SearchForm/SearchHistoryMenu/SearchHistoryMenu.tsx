import { ContextualMenu, Icon } from "@canonical/react-components";
import { useFormikContext } from "formik";
import type { JSX } from "react";

import { getCrossModelQueryLoading } from "store/juju/selectors";
import { useAppSelector } from "store/store";

import type { FormFields } from "../types";

import { Label } from "./types";

type Props = {
  queryHistory: string[];
  search: (query: string) => void;
  setQueryHistory: (queryHistory: string[]) => void;
};

const SearchHistoryMenu = ({
  queryHistory,
  search,
  setQueryHistory,
}: Props): JSX.Element => {
  const loading = useAppSelector(getCrossModelQueryLoading);
  const { setFieldValue } = useFormikContext<FormFields>();

  return (
    <ContextualMenu
      links={[
        ...queryHistory.map((query) => ({
          children: query,
          disabled: loading,
          onClick: async () => {
            search(query);
            await setFieldValue("query", query);
          },
        })),
        {
          children: (
            <>
              <Icon name="delete" /> {Label.CLEAR}
            </>
          ),
          onClick: () => setQueryHistory([]),
        },
      ]}
      position="left"
      scrollOverflow
      toggleClassName="has-icon"
      toggleDisabled={queryHistory.length === 0}
      toggleLabel={<Icon name="revisions">{Label.HISTORY}</Icon>}
    />
  );
};

export default SearchHistoryMenu;
