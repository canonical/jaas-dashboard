import { ModelWatcherData } from "juju/types";

export type TSFixMe = any;

export type Controller = {
  additionalController?: boolean;
  path: string;
  Public?: boolean;
  uuid: string;
  version: string;
};

export type Controllers = Record<string, Controller>;

export type JujuState = {
  controllers: Controllers | null;
  models: ModelsList;
  modelData: TSFixMe;
  modelWatcherData: ModelWatcherData;
};

export type ModelsList = {
  [uuid: string]: ModelListInfo;
};

export type ModelListInfo = {
  name: string;
  ownerTag: string;
  type: string;
  uuid: string;
};
