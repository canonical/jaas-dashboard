import { Formik } from "formik";

import type { RootState } from "store/store";
import { rootStateFactory, jujuStateFactory } from "testing/factories";
import { modelUserInfoFactory } from "testing/factories/juju/ModelManagerV9";
import { auditEventFactory } from "testing/factories/juju/jimm";
import {
  auditEventsStateFactory,
  modelListInfoFactory,
  modelDataFactory,
  modelDataInfoFactory,
} from "testing/factories/juju/juju";
import { renderComponent } from "testing/utils";

import Fields from "./Fields";

describe("Fields", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory.build({
      juju: jujuStateFactory.build({
        auditEvents: auditEventsStateFactory.build({
          items: [],
          loaded: true,
        }),
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should suggest user options", async () => {
    state.juju.auditEvents.items = [
      auditEventFactory.build({
        "user-tag": "user-eggman",
      }),
      auditEventFactory.build({
        "user-tag": "user-spaceman",
      }),
      auditEventFactory.build({
        "user-tag": "user-eggman",
      }),
    ];
    state.juju.modelData = {
      abc123: modelDataFactory.build({
        info: modelDataInfoFactory.build({
          users: [
            modelUserInfoFactory.build({
              user: "eggman",
            }),

            modelUserInfoFactory.build({
              user: "policeman",
            }),
          ],
        }),
      }),
    };
    renderComponent(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <Fields />
      </Formik>,
      { state }
    );
    expect(
      document.querySelector("option[value='eggman']")
    ).toBeInTheDocument();
    expect(document.querySelectorAll("option[value='eggman']")).toHaveLength(1);
    expect(
      document.querySelector("option[value='spaceman']")
    ).toBeInTheDocument();
    expect(
      document.querySelector("option[value='policeman']")
    ).toBeInTheDocument();
  });

  it("should suggest model options", async () => {
    state.juju.auditEvents.items = [
      auditEventFactory.build({
        model: "testmodel1",
      }),
      auditEventFactory.build({
        model: "testmodel1",
      }),
      auditEventFactory.build({
        model: "testmodel2",
      }),
    ];
    state.juju.models = {
      abc123: modelListInfoFactory.build({
        name: "testmodel1",
      }),
      def456: modelListInfoFactory.build({
        name: "testmodel3",
      }),
    };
    renderComponent(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <Fields />
      </Formik>,
      { state }
    );
    expect(
      document.querySelector("option[value='testmodel1']")
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll("option[value='testmodel1']")
    ).toHaveLength(1);
    expect(
      document.querySelector("option[value='testmodel2']")
    ).toBeInTheDocument();
    expect(
      document.querySelector("option[value='testmodel3']")
    ).toBeInTheDocument();
  });

  it("should suggest facade options", async () => {
    state.juju.auditEvents.items = [
      auditEventFactory.build({
        "facade-name": "Admin",
      }),
      auditEventFactory.build({
        "facade-name": "Admin",
      }),
      auditEventFactory.build({
        "facade-name": "ModelManager",
      }),
    ];
    renderComponent(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <Fields />
      </Formik>,
      { state }
    );
    expect(document.querySelector("option[value='Admin']")).toBeInTheDocument();
    expect(document.querySelectorAll("option[value='Admin']")).toHaveLength(1);
    expect(
      document.querySelector("option[value='ModelManager']")
    ).toBeInTheDocument();
  });

  it("should suggest method options", async () => {
    state.juju.auditEvents.items = [
      auditEventFactory.build({
        "facade-method": "Login",
      }),
      auditEventFactory.build({
        "facade-method": "AddModel",
      }),
      auditEventFactory.build({
        "facade-method": "Login",
      }),
    ];
    renderComponent(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <Fields />
      </Formik>,
      { state }
    );
    expect(document.querySelector("option[value='Login']")).toBeInTheDocument();
    expect(document.querySelectorAll("option[value='Login']")).toHaveLength(1);
    expect(
      document.querySelector("option[value='AddModel']")
    ).toBeInTheDocument();
  });
});
