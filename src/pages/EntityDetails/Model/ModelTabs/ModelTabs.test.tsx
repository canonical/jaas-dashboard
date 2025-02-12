import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { JIMMRelation, JIMMTarget } from "juju/jimm/JIMMV4";
import type { RootState } from "store/store";
import { jujuStateFactory, rootStateFactory } from "testing/factories";
import {
  generalStateFactory,
  configFactory,
  controllerFeaturesFactory,
  controllerFeaturesStateFactory,
  authUserInfoFactory,
} from "testing/factories/general";
import {
  modelListInfoFactory,
  rebacRelationFactory,
} from "testing/factories/juju/juju";
import {
  modelFeaturesStateFactory,
  modelFeaturesFactory,
} from "testing/factories/juju/juju";
import {
  modelWatcherModelDataFactory,
  modelWatcherModelInfoFactory,
} from "testing/factories/juju/model-watcher";
import { renderComponent } from "testing/utils";
import { ModelTab } from "urls";

import ModelTabs from "./ModelTabs";
import { Label } from "./types";

describe("ModelTabs", () => {
  let state: RootState;
  const path = "/models/:userName/:modelName";
  const url = "/models/eggman@external/enterprise";

  beforeEach(() => {
    state = rootStateFactory.withGeneralConfig().build({
      general: generalStateFactory.build({
        config: configFactory.build({
          controllerAPIEndpoint: "wss://jimm.jujucharms.com/api",
        }),
        controllerConnections: {
          "wss://jimm.jujucharms.com/api": {
            user: authUserInfoFactory.build(),
          },
        },
      }),
      juju: jujuStateFactory.build({
        models: {
          abc123: modelListInfoFactory.build({
            uuid: "abc123",
            name: "enterprise",
          }),
        },
      }),
    });
  });

  it("lists tabs", () => {
    renderComponent(<ModelTabs />, { path, url, state });
    const sections = [
      {
        text: Label.APPLICATIONS,
        query: ModelTab.APPS,
      },
      {
        text: Label.INTEGRATIONS,
        query: ModelTab.INTEGRATIONS,
      },
      {
        text: Label.ACTION_LOGS,
        query: ModelTab.LOGS,
      },
      {
        text: Label.MACHINES,
        query: ModelTab.MACHINES,
      },
    ];
    expect(screen.getAllByRole("link")).toHaveLength(sections.length);
    sections.forEach((section) => {
      expect(
        screen.getByRole("link", { name: section.text }),
      ).toBeInTheDocument();
    });
  });

  it("does not display the machine tab for kubernetes", () => {
    state.juju.modelWatcherData = {
      abc123: modelWatcherModelDataFactory.build({
        model: modelWatcherModelInfoFactory.build({
          name: "enterprise",
          owner: "eggman@external",
          type: "kubernetes",
        }),
      }),
    };
    renderComponent(<ModelTabs />, { path, url, state });
    expect(
      screen.queryByRole("link", { name: Label.MACHINES }),
    ).not.toBeInTheDocument();
  });

  it("displays the secrets tab if available", () => {
    state.juju.modelFeatures = modelFeaturesStateFactory.build({
      abc123: modelFeaturesFactory.build({
        listSecrets: true,
      }),
    });
    renderComponent(<ModelTabs />, { path, url, state });
    expect(
      screen.getByRole("link", { name: Label.SECRETS }),
    ).toBeInTheDocument();
  });

  it("displays a logs link if audit logs are available", () => {
    state.general.controllerFeatures = controllerFeaturesStateFactory.build({
      "wss://jimm.jujucharms.com/api": controllerFeaturesFactory.build({
        auditLogs: true,
      }),
    });
    state.juju.rebacRelations = [
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
    ];
    renderComponent(<ModelTabs />, { path, url, state });
    expect(screen.getByRole("link", { name: Label.LOGS })).toBeInTheDocument();
  });

  it("clicking the tabs changes the visible section", async () => {
    state.juju.modelFeatures = modelFeaturesStateFactory.build({
      abc123: modelFeaturesFactory.build({
        listSecrets: true,
      }),
    });
    const { router } = renderComponent(<ModelTabs />, { path, url, state });
    const sections = [
      {
        text: Label.APPLICATIONS,
        query: ModelTab.APPS,
      },
      {
        text: Label.INTEGRATIONS,
        query: ModelTab.INTEGRATIONS,
      },
      {
        text: Label.ACTION_LOGS,
        query: ModelTab.LOGS,
      },
      {
        text: Label.MACHINES,
        query: ModelTab.MACHINES,
      },
      {
        text: Label.SECRETS,
        query: ModelTab.SECRETS,
      },
    ];
    for (const section of sections) {
      await userEvent.click(screen.getByRole("link", { name: section.text }));
      expect(router.state.location.search).toEqual(
        `?activeView=${section.query}`,
      );
    }
  });

  it("scrolls tabs into view", async () => {
    renderComponent(<ModelTabs />, { path, url, state });
    const scrollIntoView = vi.fn();
    fireEvent.click(screen.getByRole("link", { name: Label.APPLICATIONS }), {
      target: {
        scrollIntoView,
      },
    });
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    });
  });
});
