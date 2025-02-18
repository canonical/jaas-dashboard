import { renderHook, waitFor } from "@testing-library/react";
import configureStore from "redux-mock-store";

import type { RelationshipTuple } from "juju/jimm/JIMMV4";
import { JIMMRelation, JIMMTarget } from "juju/jimm/JIMMV4";
import { actions as jujuActions } from "store/juju";
import type { RootState } from "store/store";
import { rootStateFactory } from "testing/factories";
import {
  configFactory,
  generalStateFactory,
  controllerFeaturesFactory,
  controllerFeaturesStateFactory,
  authUserInfoFactory,
} from "testing/factories/general";
import { rebacRelationFactory } from "testing/factories/juju/juju";
import { ComponentProviders } from "testing/utils";

import {
  useCheckPermissions,
  useIsJIMMAdmin,
  useAuditLogsPermitted,
} from "./permissions";

const mockStore = configureStore<RootState, unknown>([]);

describe("useCheckPermissions", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory.build({
      general: generalStateFactory.build({
        config: configFactory.build({
          controllerAPIEndpoint: "wss://example.com/api",
        }),
        controllerFeatures: controllerFeaturesStateFactory.build({
          "wss://example.com/api": controllerFeaturesFactory.build({
            rebac: true,
          }),
        }),
      }),
    });
  });

  it("checks relations", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.MEMBER,
      target_object: "group-admins",
    };
    const store = mockStore(state);
    renderHook(() => useCheckPermissions(tuple), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    const action = jujuActions.checkRelation({
      tuple,
      wsControllerURL: "wss://example.com/api",
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find((dispatch) => dispatch.type === jujuActions.checkRelation.type),
      ).toMatchObject(action);
    });
  });

  it("returns the relation", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.MEMBER,
      target_object: "group-admins",
    };
    state.juju.rebacRelations = [
      rebacRelationFactory.build({
        tuple: tuple,
        loading: true,
        loaded: true,
        allowed: true,
      }),
    ];
    const store = mockStore(state);
    const { result } = renderHook(() => useCheckPermissions(tuple), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    expect(result.current).toMatchObject({
      loading: true,
      loaded: true,
      permitted: true,
    });
  });

  it("does not try and fetch a relation if the tuple is not provided", async () => {
    const store = mockStore(state);
    renderHook(() => useCheckPermissions(), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find((dispatch) => dispatch.type === jujuActions.checkRelation.type),
      ).toBeUndefined();
    });
  });

  it("does not try and fetch a relation if the tuple object has a new reference", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.MEMBER,
      target_object: "group-admins",
    };
    const store = mockStore(state);
    const { rerender } = renderHook(() => useCheckPermissions(tuple), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .filter(
            (dispatch) => dispatch.type === jujuActions.checkRelation.type,
          ),
      ).toHaveLength(1);
    });
    rerender({ ...tuple });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .filter(
            (dispatch) => dispatch.type === jujuActions.checkRelation.type,
          ),
      ).toHaveLength(1);
    });
  });

  it("does not fetch a relation that is already loading", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.MEMBER,
      target_object: "group-admins",
    };
    state.juju.rebacRelations = [
      rebacRelationFactory.build({
        tuple: tuple,
        loading: true,
      }),
    ];
    const store = mockStore(state);
    renderHook(() => useCheckPermissions(tuple), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find((dispatch) => dispatch.type === jujuActions.checkRelation.type),
      ).toBeUndefined();
    });
  });

  it("does not fetch a relation that has already loaded", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.MEMBER,
      target_object: "group-admins",
    };
    state.juju.rebacRelations = [
      rebacRelationFactory.build({
        tuple: tuple,
        loaded: true,
      }),
    ];
    const store = mockStore(state);
    renderHook(() => useCheckPermissions(tuple), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find((dispatch) => dispatch.type === jujuActions.checkRelation.type),
      ).toBeUndefined();
    });
  });

  it("cleans up a previous relation if the tuple changes", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.MEMBER,
      target_object: "group-admins",
    };
    state.juju.rebacRelations = [
      rebacRelationFactory.build({
        tuple: tuple,
        loaded: true,
      }),
    ];
    const store = mockStore(state);
    const { rerender } = renderHook<
      {
        permitted: boolean;
        loading: boolean;
        loaded: boolean;
      },
      {
        tupleObject: RelationshipTuple;
        cleanup: boolean;
      }
    >(
      ({ tupleObject, cleanup } = { tupleObject: tuple, cleanup: true }) =>
        useCheckPermissions(tupleObject, cleanup),
      {
        wrapper: (props) => (
          <ComponentProviders {...props} path="/" store={store} />
        ),
      },
    );
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find((dispatch) => dispatch.type === jujuActions.checkRelation.type),
      ).toBeUndefined();
    });
    rerender({ tupleObject: { ...tuple, object: "newobject" }, cleanup: true });
    const action = jujuActions.removeCheckRelation({
      tuple,
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find(
            (dispatch) =>
              dispatch.type === jujuActions.removeCheckRelation.type,
          ),
      ).toMatchObject(action);
    });
  });

  it("can clean up a relation", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.MEMBER,
      target_object: "group-admins",
    };
    state.juju.rebacRelations = [
      rebacRelationFactory.build({
        tuple: tuple,
        loaded: true,
      }),
    ];
    const store = mockStore(state);
    const { unmount } = renderHook(() => useCheckPermissions(tuple, true), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    const action = jujuActions.removeCheckRelation({
      tuple,
    });
    unmount();
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find(
            (dispatch) =>
              dispatch.type === jujuActions.removeCheckRelation.type,
          ),
      ).toMatchObject(action);
    });
  });

  it("does not fetch a relation if rebac is not enabled", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.MEMBER,
      target_object: "group-admins",
    };
    state.general.controllerFeatures = controllerFeaturesStateFactory.build({
      "wss://example.com/api": controllerFeaturesFactory.build({
        rebac: false,
      }),
    });
    const store = mockStore(state);
    renderHook(() => useCheckPermissions(tuple), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find((dispatch) => dispatch.type === jujuActions.checkRelation.type),
      ).toBeUndefined();
    });
  });
});

describe("useIsJIMMAdmin", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory.build({
      general: generalStateFactory.build({
        config: configFactory.build({
          controllerAPIEndpoint: "wss://example.com/api",
        }),
        controllerConnections: {
          "wss://example.com/api": {
            user: authUserInfoFactory.build(),
          },
        },
        controllerFeatures: controllerFeaturesStateFactory.build({
          "wss://example.com/api": controllerFeaturesFactory.build({
            rebac: true,
          }),
        }),
      }),
    });
  });

  it("checks the relation", async () => {
    const store = mockStore(state);
    renderHook(() => useIsJIMMAdmin(), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    const action = jujuActions.checkRelation({
      tuple: {
        object: "user-eggman@external",
        relation: JIMMRelation.ADMINISTRATOR,
        target_object: JIMMTarget.JIMM_CONTROLLER,
      },
      wsControllerURL: "wss://example.com/api",
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find((dispatch) => dispatch.type === jujuActions.checkRelation.type),
      ).toMatchObject(action);
    });
  });

  it("returns the relation", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.ADMINISTRATOR,
      target_object: JIMMTarget.JIMM_CONTROLLER,
    };
    state.juju.rebacRelations = [
      rebacRelationFactory.build({
        tuple: tuple,
        loading: true,
        loaded: true,
        allowed: true,
      }),
    ];
    const store = mockStore(state);
    const { result } = renderHook(() => useIsJIMMAdmin(), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    expect(result.current).toMatchObject({
      loading: true,
      loaded: true,
      permitted: true,
    });
  });

  it("does not try and fetch the relation if the user is not found", async () => {
    state.general.controllerConnections = {};
    const store = mockStore(state);
    renderHook(() => useIsJIMMAdmin(), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find((dispatch) => dispatch.type === jujuActions.checkRelation.type),
      ).toBeUndefined();
    });
  });

  it("can clean up the relation", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.ADMINISTRATOR,
      target_object: JIMMTarget.JIMM_CONTROLLER,
    };
    state.juju.rebacRelations = [
      rebacRelationFactory.build({
        tuple: tuple,
        loaded: true,
      }),
    ];
    const store = mockStore(state);
    const { unmount } = renderHook(() => useIsJIMMAdmin(true), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    const action = jujuActions.removeCheckRelation({
      tuple,
    });
    unmount();
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find(
            (dispatch) =>
              dispatch.type === jujuActions.removeCheckRelation.type,
          ),
      ).toMatchObject(action);
    });
  });
});

describe("useAuditLogsPermitted", () => {
  let state: RootState;

  beforeEach(() => {
    state = rootStateFactory.build({
      general: generalStateFactory.build({
        config: configFactory.build({
          controllerAPIEndpoint: "wss://example.com/api",
        }),
        controllerConnections: {
          "wss://example.com/api": {
            user: authUserInfoFactory.build(),
          },
        },
        controllerFeatures: controllerFeaturesStateFactory.build({
          "wss://example.com/api": controllerFeaturesFactory.build({
            rebac: true,
            auditLogs: true,
          }),
        }),
      }),
    });
  });

  it("checks the relation", async () => {
    const store = mockStore(state);
    renderHook(() => useAuditLogsPermitted(), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    const auditLogAction = jujuActions.checkRelation({
      tuple: {
        object: "user-eggman@external",
        relation: JIMMRelation.AUDIT_LOG_VIEWER,
        target_object: JIMMTarget.JIMM_CONTROLLER,
      },
      wsControllerURL: "wss://example.com/api",
    });
    const adminAction = jujuActions.checkRelation({
      tuple: {
        object: "user-eggman@external",
        relation: JIMMRelation.ADMINISTRATOR,
        target_object: JIMMTarget.JIMM_CONTROLLER,
      },
      wsControllerURL: "wss://example.com/api",
    });
    await waitFor(() => {
      const dispatched = store
        .getActions()
        .filter((dispatch) => dispatch.type === jujuActions.checkRelation.type);
      expect(dispatched).toEqual(
        expect.arrayContaining([adminAction, auditLogAction]),
      );
    });
  });

  it("returns the relation", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.AUDIT_LOG_VIEWER,
      target_object: JIMMTarget.JIMM_CONTROLLER,
    };
    state.juju.rebacRelations = [
      rebacRelationFactory.build({
        tuple: tuple,
        loading: true,
        loaded: true,
        allowed: true,
      }),
      rebacRelationFactory.build({
        tuple: {
          object: "user-eggman@external",
          relation: JIMMRelation.ADMINISTRATOR,
          target_object: JIMMTarget.JIMM_CONTROLLER,
        },
        allowed: true,
      }),
    ];
    const store = mockStore(state);
    const { result } = renderHook(() => useAuditLogsPermitted(), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    expect(result.current).toMatchObject({
      loading: true,
      loaded: true,
      permitted: true,
    });
  });

  it("does not try and fetch the relation if the user is not found", async () => {
    state.general.controllerConnections = {};
    const store = mockStore(state);
    renderHook(() => useAuditLogsPermitted(), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    await waitFor(() => {
      expect(
        store
          .getActions()
          .find((dispatch) => dispatch.type === jujuActions.checkRelation.type),
      ).toBeUndefined();
    });
  });

  it("does not try and fetch the relation if audit logs are not enabled", async () => {
    state.general.controllerFeatures = controllerFeaturesStateFactory.build({
      "wss://example.com/api": controllerFeaturesFactory.build({
        rebac: true,
        auditLogs: false,
      }),
    });
    const store = mockStore(state);
    renderHook(() => useAuditLogsPermitted(), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    const auditLogAction = jujuActions.checkRelation({
      tuple: {
        object: "user-eggman@external",
        relation: JIMMRelation.AUDIT_LOG_VIEWER,
        target_object: JIMMTarget.JIMM_CONTROLLER,
      },
      wsControllerURL: "wss://example.com/api",
    });
    await waitFor(() => {
      const dispatched = store
        .getActions()
        .filter((dispatch) => dispatch.type === jujuActions.checkRelation.type);
      expect(dispatched).not.toEqual(expect.arrayContaining([auditLogAction]));
    });
  });

  it("can clean up the relation", async () => {
    const tuple = {
      object: "user-eggman@external",
      relation: JIMMRelation.AUDIT_LOG_VIEWER,
      target_object: JIMMTarget.JIMM_CONTROLLER,
    };
    state.juju.rebacRelations = [
      rebacRelationFactory.build({
        tuple: tuple,
        loaded: true,
      }),
    ];
    const store = mockStore(state);
    const { unmount } = renderHook(() => useAuditLogsPermitted(true), {
      wrapper: (props) => (
        <ComponentProviders {...props} path="/" store={store} />
      ),
    });
    unmount();
    const auditLogAction = jujuActions.removeCheckRelation({
      tuple: {
        object: "user-eggman@external",
        relation: JIMMRelation.AUDIT_LOG_VIEWER,
        target_object: JIMMTarget.JIMM_CONTROLLER,
      },
    });
    const adminAction = jujuActions.removeCheckRelation({
      tuple: {
        object: "user-eggman@external",
        relation: JIMMRelation.ADMINISTRATOR,
        target_object: JIMMTarget.JIMM_CONTROLLER,
      },
    });
    await waitFor(() => {
      const dispatched = store
        .getActions()
        .filter(
          (dispatch) => dispatch.type === jujuActions.removeCheckRelation.type,
        );
      expect(dispatched).toEqual(
        expect.arrayContaining([adminAction, auditLogAction]),
      );
    });
  });
});
