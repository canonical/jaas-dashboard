import { Form, useFormikContext } from "formik";
import type { JSX, ReactNode } from "react";
import { useEffect } from "react";

import type { SetFieldValue } from "./types";

type Props<V> = {
  children: ReactNode;
  onFormChange: (data: V) => void;
  onSetup: (setFieldValue: SetFieldValue<V>) => void;
};

export default function FormikFormData<V>({
  children,
  onFormChange,
  onSetup,
}: Props<V>): JSX.Element {
  const { values, setFieldValue } = useFormikContext<V>();

  useEffect(() => {
    onSetup(setFieldValue);
  }, [onSetup, setFieldValue]);

  useEffect(() => {
    onFormChange(values);
  }, [onFormChange, values]);

  return <Form>{children}</Form>;
}
