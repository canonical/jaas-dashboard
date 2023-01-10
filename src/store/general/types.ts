import { TSFixMe } from "types";

export type Config = {
  controllerAPIEndpoint: string;
  baseAppURL: string;
  // Support for 2.9 configuration.
  baseControllerURL?: string;
  identityProviderAvailable: boolean;
  identityProviderURL: string;
  isJuju: boolean;
};

// TSFixMe: This should use the ConnectionInfo type once it has been exported
// from jujulib.
export type ControllerConnections = Record<string, TSFixMe>;

export type PingerIntervalIds = Record<string, number>;

export type Credential = {
  user: string;
  password: string;
};
export type Credentials = Record<string, Credential>;

export type GeneralState = {
  appVersion: string | null;
  config: Config | null;
  controllerConnections: ControllerConnections | null;
  credentials: Credentials | null;
  loginError: string | null;
  pingerIntervalIds: PingerIntervalIds | null;
  visitURL: string | null;
};
