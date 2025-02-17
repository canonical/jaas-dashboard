import { Button } from "@canonical/react-components";
import { Form, Formik } from "formik";
import type { JSX } from "react";
import { useId } from "react";

import { type AuditLogFilters } from "components/AuditLogsTable/AuditLogsTableFilters/AuditLogsTableFilters";
import { DEFAULT_AUDIT_LOG_FILTERS } from "components/AuditLogsTable/AuditLogsTableFilters/consts";
import Panel from "components/Panel";
import { useQueryParams } from "hooks/useQueryParams";
import { usePanelQueryParams } from "panels/hooks";

import Fields from "./Fields";
import { Label, TestId, type FormFields } from "./types";

const AuditLogsFilterPanel = (): JSX.Element => {
  const formId = useId();
  const [, , handleRemovePanelQueryParams] = usePanelQueryParams<{
    panel: string | null;
  }>({
    panel: null,
  });
  // These params are handled separately from the values in usePanelQueryParams
  // as they shouldn't be cleared when the panel closes.
  const [queryParams, setQueryParams] = useQueryParams<
    AuditLogFilters & { page: string | null; panel: string | null }
  >({
    ...DEFAULT_AUDIT_LOG_FILTERS,
    page: null,
    panel: null,
  });
  // Extract just the filters so that they can be looped over.
  const { page: _page, panel: _panel, ...filters } = queryParams;
  const hasFilters = Object.values(filters).some((filter) => !!filter);
  return (
    <>
      <Panel
        data-testid={TestId.PANEL}
        drawer={
          <>
            <Button
              disabled={!hasFilters}
              onClick={() => {
                setQueryParams({
                  ...DEFAULT_AUDIT_LOG_FILTERS,
                  page: null,
                  panel: undefined,
                });
              }}
              type="button"
            >
              {Label.CLEAR}
            </Button>
            <Button appearance="positive" type="submit" form={formId}>
              {Label.FILTER}
            </Button>
          </>
        }
        onRemovePanelQueryParams={handleRemovePanelQueryParams}
        title="Filter audit logs"
        width="narrow"
      >
        <Formik<FormFields>
          initialValues={{
            // Restore the values from the query string.
            after: queryParams.after ?? "",
            before: queryParams.before ?? "",
            user: queryParams.user ?? "",
            model: queryParams.model ?? "",
            method: queryParams.method ?? "",
          }}
          onSubmit={(values) => {
            // Replace empty strings with `null` so that the query params get
            // removed from the URL rather than being set to empty values (the
            // useQueryParams hook will remove null or undefined values, but
            // keeps the queryParam if it is an empty string).
            const filters = Object.entries(values).reduce<
              Record<keyof FormFields, string | null>
            >(
              (filters, [filterName, filterValue]) => {
                filters[filterName as keyof FormFields] = filterValue
                  ? filterValue
                  : null;
                return filters;
              },
              { ...values },
            );
            // Set the filters and close the panel.
            setQueryParams({
              ...filters,
              page: null,
              panel: undefined,
            });
          }}
        >
          <Form id={formId}>
            <Fields />
          </Form>
        </Formik>
      </Panel>
    </>
  );
};

export default AuditLogsFilterPanel;
