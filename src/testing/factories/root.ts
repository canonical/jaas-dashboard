import { Factory } from "fishery";

import { RootState } from "store/store";

import { jujuStateFactory } from "./juju";
import { uiStateFactory } from "./ui";

export const rootStateFactory = Factory.define<RootState>(() => ({
  general: {
    appVersion: null,
    controllerConnections: null,
    credentials: null,
    loginError: null,
    pingerIntervalIds: null,
    visitURL: null,
    config: {
      controllerAPIEndpoint: "wss://jimm.jujucharms.com/api",
      baseAppURL: "/",
      identityProviderAvailable: false,
      identityProviderURL: "",
      isJuju: false,
    },
  },
  juju: jujuStateFactory.build(),
  ui: uiStateFactory.build(),
}));
