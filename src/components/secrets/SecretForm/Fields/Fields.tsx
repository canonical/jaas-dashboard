import {
  Button,
  FormikField,
  Icon,
  Textarea,
} from "@canonical/react-components";
import { FieldArray, useFormikContext } from "formik";
import type { JSX } from "react";

import type { FormFields } from "../types";

import { Label } from "./types";

type Props = {
  update?: boolean;
};

const Fields = ({ update }: Props): JSX.Element => {
  const { values } = useFormikContext<FormFields>();

  return (
    <>
      <FormikField label={Label.LABEL} name="label" type="text" />
      <FormikField
        label={Label.DESCRIPTION}
        name="description"
        component={Textarea}
      />
      <h5>Secret key/value pairs</h5>
      <FieldArray
        name="pairs"
        render={(arrayHelpers) => (
          <>
            {values.pairs.map((pair, index) => (
              <fieldset key={index}>
                <FormikField
                  label={`${Label.KEY} ${index + 1}`}
                  name={`pairs.${index}.key`}
                  type="text"
                  required
                />
                <FormikField
                  label={`${Label.VALUE} ${index + 1}`}
                  name={`pairs.${index}.value`}
                  component={Textarea}
                  required
                />
                <FormikField
                  id={Label.IS_BASE_64}
                  label={Label.IS_BASE_64}
                  name={`pairs.${index}.isBase64`}
                  type="checkbox"
                />
                <Button
                  className="u-no-margin--bottom"
                  disabled={values.pairs.length <= 1}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    arrayHelpers.remove(index);
                  }}
                  hasIcon
                >
                  <Icon name="minus" />
                  <span>{Label.REMOVE}</span>
                </Button>
              </fieldset>
            ))}
            <Button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                arrayHelpers.push({ key: "", value: "", isBase64: false });
              }}
              hasIcon
            >
              <Icon name="plus" />
              <span>{Label.ADD}</span>
            </Button>
          </>
        )}
      />
      {update ? (
        <FormikField
          id={Label.AUTO_PRUNE}
          label={Label.AUTO_PRUNE}
          name="autoPrune"
          type="checkbox"
          help="Automatically remove unused revisions."
        />
      ) : null}
    </>
  );
};

export default Fields;
