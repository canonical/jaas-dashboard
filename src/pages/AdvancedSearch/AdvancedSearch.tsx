import type { JSX } from "react";

import BaseLayout from "layout/BaseLayout/BaseLayout";

import ErrorsBlock from "./ErrorsBlock";
import ResultsBlock from "./ResultsBlock";
import SearchForm from "./SearchForm";
import { TestId } from "./types";

const AdvancedSearch = (): JSX.Element => (
  <BaseLayout data-testid={TestId.COMPONENT} title="Advanced search">
    <SearchForm />
    <ErrorsBlock />
    <ResultsBlock />
  </BaseLayout>
);

export default AdvancedSearch;
