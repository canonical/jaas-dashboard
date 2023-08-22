import { Button, Col, Row, Textarea } from "@canonical/react-components";
import type { FormikProps } from "formik";
import { Field, Form, Formik } from "formik";
import { useEffect, useRef } from "react";

import { useQueryParams } from "hooks/useQueryParams";
import {
  getControllerConnection,
  getWSControllerURL,
} from "store/general/selectors";
import { actions as jujuActions } from "store/juju";
import { useAppDispatch, useAppSelector } from "store/store";

type Fields = {
  query: string;
};

const SearchForm = (): JSX.Element => {
  const formikRef = useRef<FormikProps<Fields>>(null);
  const dispatch = useAppDispatch();
  const wsControllerURL = useAppSelector(getWSControllerURL);
  const hasControllerConnection = useAppSelector((state) =>
    getControllerConnection(state, wsControllerURL)
  );
  const [queryParams, setQueryParams] = useQueryParams<{ q: string }>({
    q: "",
  });
  const jqParam = decodeURIComponent(queryParams.q);

  useEffect(() => {
    if (jqParam && hasControllerConnection && wsControllerURL) {
      dispatch(
        jujuActions.fetchCrossModelQuery({
          query: jqParam,
          wsControllerURL,
        })
      );
    }
  }, [dispatch, hasControllerConnection, jqParam, wsControllerURL]);

  return (
    <Formik<Fields>
      initialValues={{
        query: jqParam,
      }}
      innerRef={formikRef}
      onSubmit={(values) => {
        const { query } = values;
        if (query) {
          setQueryParams({ q: encodeURIComponent(query) });
        }
      }}
    >
      <Form data-testid="search-form">
        <Row className="u-no-padding">
          <Col size={6}>
            <Field
              as={Textarea}
              onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (event.key === "Enter") {
                  // Prevent new lines from being created when Enter is pressed.
                  event.preventDefault();
                  // Submit the form.
                  formikRef.current?.handleSubmit();
                }
              }}
              name="query"
              rows={8}
            />
            <Button type="submit">Search</Button>
          </Col>
        </Row>
      </Form>
    </Formik>
  );
};

export default SearchForm;
