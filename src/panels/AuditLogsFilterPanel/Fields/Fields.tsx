import { Input } from "@canonical/react-components";
import { format } from "date-fns";
import { Field, useFormikContext } from "formik";
import type { JSX } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";

import AutocompleteInput from "components/AutocompleteInput";
import type { EntityDetailsRoute } from "components/Routes";
import { DATETIME_LOCAL } from "consts";
import {
  getAuditEventsMethods,
  getAuditEventsUsers,
  getAuditEventsModels,
  getFullModelNames,
  getUsers,
} from "store/juju/selectors";

import type { FormFields } from "../types";

import { Label } from "./types";

const Fields = (): JSX.Element => {
  const { modelName } = useParams<EntityDetailsRoute>();
  const showModel = !modelName;
  const auditEventUsers = useSelector(getAuditEventsUsers);
  const jujuUsers = useSelector(getUsers);
  // Get the unique users from the logs and models returned from Juju.
  const users = Array.from(new Set([...auditEventUsers, ...jujuUsers]));
  const auditEventModels = useSelector(getAuditEventsModels);
  const jujuModels = useSelector(getFullModelNames);
  // Get the unique model names from the logs and models returned from Juju.
  const models = Array.from(new Set([...auditEventModels, ...jujuModels]));
  const methods = useSelector(getAuditEventsMethods);
  const { values } = useFormikContext<FormFields>();

  return (
    <>
      <Field
        type="datetime-local"
        // Have to manually set the id until this issue has been fixed:
        // https://github.com/canonical/react-components/issues/957
        id={Label.AFTER}
        label={Label.AFTER}
        // Prevent this field from choosing a date after the 'Before' date or in
        // the future.
        max={values.before ? values.before : format(new Date(), DATETIME_LOCAL)}
        name="after"
        as={Input}
      />
      <Field
        type="datetime-local"
        // Have to manually set the id until this issue has been fixed:
        // https://github.com/canonical/react-components/issues/957
        id={Label.BEFORE}
        label={Label.BEFORE}
        // Prevent this field from choosing a date before the 'After' date.
        min={values.after}
        // Prevent this field from choosing a date in the future.
        max={format(new Date(), DATETIME_LOCAL)}
        name="before"
        as={Input}
      />
      <Field
        type="text"
        // Have to manually set the id until this issue has been fixed:
        // https://github.com/canonical/react-components/issues/957
        id={Label.USER}
        label={Label.USER}
        name="user"
        as={AutocompleteInput}
        options={users}
      />
      {showModel ? (
        <Field
          type="text"
          help='A model name in the format "controller-name/model-name".'
          // Have to manually set the id until this issue has been fixed:
          // https://github.com/canonical/react-components/issues/957
          id={Label.MODEL}
          label={Label.MODEL}
          name="model"
          as={AutocompleteInput}
          options={models}
        />
      ) : null}
      <Field
        type="text"
        // Have to manually set the id until this issue has been fixed:
        // https://github.com/canonical/react-components/issues/957
        id={Label.METHOD}
        label={Label.METHOD}
        name="method"
        as={AutocompleteInput}
        options={methods}
      />
    </>
  );
};

export default Fields;
