import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuditLogsTableActionsLabel } from "components/AuditLogsTable/AuditLogsTableActions";
import { JIMMRelation, JIMMTarget } from "juju/jimm/JIMMV4";
import { rootStateFactory, jujuStateFactory } from "testing/factories";
import {
  configFactory,
  generalStateFactory,
  controllerFeaturesFactory,
  controllerFeaturesStateFactory,
  authUserInfoFactory,
} from "testing/factories/general";
import { rebacRelationFactory } from "testing/factories/juju/juju";
import { renderComponent } from "testing/utils";

import Logs from "./Logs";

describe("Logs", () => {
  const url = "/models/eggman@external/test1";
  const path = "/models/:userName/:modelName";

  it("can display the action logs tab", async () => {
    renderComponent(<Logs />, {
      url: `${url}?activeView=logs`,
      path,
    });

    expect(screen.getByRole("tab", { name: "Action logs" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      document.querySelector(".entity-details__action-logs"),
    ).toBeInTheDocument();
  });

  it("can display the audit logs tab", async () => {
    const state = rootStateFactory.withGeneralConfig().build({
      general: generalStateFactory.build({
        config: configFactory.build({
          controllerAPIEndpoint: "wss://jimm.jujucharms.com/api",
        }),
        controllerFeatures: controllerFeaturesStateFactory.build({
          "wss://jimm.jujucharms.com/api": controllerFeaturesFactory.build({
            auditLogs: true,
          }),
        }),
        controllerConnections: {
          "wss://jimm.jujucharms.com/api": {
            user: authUserInfoFactory.build(),
          },
        },
      }),
      juju: jujuStateFactory.build({
        rebacRelations: [
          rebacRelationFactory.build({
            tuple: {
              object: "user-eggman@external",
              relation: JIMMRelation.AUDIT_LOG_VIEWER,
              target_object: JIMMTarget.JIMM_CONTROLLER,
            },
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
        ],
      }),
    });
    renderComponent(<Logs />, {
      url: `${url}?activeView=logs&tableView=audit-logs`,
      path,
      state,
    });

    expect(screen.getByRole("tab", { name: "Audit logs" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      document.querySelector(".entity-details__audit-logs"),
    ).toBeInTheDocument();
  });

  it("should not render navigation tabs and Audit Logs page on Juju", () => {
    const state = rootStateFactory.build({
      general: generalStateFactory.build({
        config: configFactory.build({
          isJuju: true,
        }),
      }),
    });
    renderComponent(<Logs />, {
      url: `${url}?activeView=logs&tableView=audit-logs`,
      path,
      state,
    });

    expect(
      screen.queryByRole("tab", { name: "Action logs" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Audit logs" }),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector(".entity-details__audit-logs"),
    ).not.toBeInTheDocument();
  });

  it("should navigate from Action Logs to Audit Logs", async () => {
    const { router } = renderComponent(<Logs />, {
      url: `${url}?activeView=logs&tableView=action-logs`,
      path,
    });
    const auditLogsTab = screen.getByRole("tab", { name: "Audit logs" });
    await userEvent.click(auditLogsTab);
    expect(router.state.location.search).toBe(
      "?activeView=logs&tableView=audit-logs",
    );
  });

  it("does not display the audit log actions when viewing the action logs tab", async () => {
    renderComponent(<Logs />, {
      url: `${url}?activeView=logs`,
      path,
    });
    expect(
      screen.queryByRole("button", { name: AuditLogsTableActionsLabel.FILTER }),
    ).not.toBeInTheDocument();
  });

  it("displays the audit log actions when viewing the audit logs tab", async () => {
    renderComponent(<Logs />, {
      url: `${url}?activeView=logs&tableView=audit-logs`,
      path,
    });
    expect(
      screen.getByRole("button", { name: AuditLogsTableActionsLabel.FILTER }),
    ).toBeInTheDocument();
  });
});
