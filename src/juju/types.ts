import type { Connection } from "@canonical/jujulib";
import type ActionV7 from "@canonical/jujulib/dist/api/facades/action/ActionV7";
import type AllWatcherV3 from "@canonical/jujulib/dist/api/facades/all-watcher/AllWatcherV3";
import type { AdditionalProperties as AnnotationsAdditionalProperties } from "@canonical/jujulib/dist/api/facades/annotations/AnnotationsV2";
import type AnnotationsV2 from "@canonical/jujulib/dist/api/facades/annotations/AnnotationsV2";
import type ApplicationV15 from "@canonical/jujulib/dist/api/facades/application/ApplicationV15";
import type CharmsV6 from "@canonical/jujulib/dist/api/facades/charms/CharmsV6";
import type { FullStatus } from "@canonical/jujulib/dist/api/facades/client/ClientV6";
import type ClientV6 from "@canonical/jujulib/dist/api/facades/client/ClientV6";
import type CloudV7 from "@canonical/jujulib/dist/api/facades/cloud/CloudV7";
import type ControllerV9 from "@canonical/jujulib/dist/api/facades/controller/ControllerV9";
import type ModelManagerV9 from "@canonical/jujulib/dist/api/facades/model-manager/ModelManagerV9";
import type { ModelSLAInfo } from "@canonical/jujulib/dist/api/facades/model-manager/ModelManagerV9";
import type PingerV1 from "@canonical/jujulib/dist/api/facades/pinger/PingerV1";

import type JIMMV2 from "juju/jimm-facade";
// See https://github.com/juju/juju/blob/develop/apiserver/params/multiwatcher.go
// for the Juju types for the AllWatcher responses.

export interface ActionData {
  [id: string]: ActionChangeDelta;
}

export interface AnnotationData {
  [appName: string]: AnnotationInfo;
}

export interface ApplicationData {
  [appName: string]: ApplicationInfo;
}

export interface MachineData {
  [key: string]: MachineChangeDelta;
}

export interface ModelCharmData {
  [charmURL: string]: CharmChangeDelta;
}

export interface ModelWatcherData {
  [uuid: string]: ModelData;
}

export interface RelationData {
  [key: string]: RelationChangeDelta;
}

export interface UnitData {
  [unitName: string]: UnitChangeDelta;
}

export type AllWatcherDelta =
  | [DeltaEntityTypes.ACTION, DeltaChangeTypes.CHANGE, ActionChangeDelta]
  | [
      DeltaEntityTypes.ANNOTATION,
      DeltaChangeTypes.CHANGE,
      AnnotationChangeDelta
    ]
  | [
      DeltaEntityTypes.APPLICATION,
      DeltaChangeTypes.CHANGE,
      ApplicationChangeDelta
    ]
  | [
      DeltaEntityTypes.APPLICATION,
      DeltaChangeTypes.REMOVE,
      ApplicationChangeDelta
    ]
  | [DeltaEntityTypes.CHARM, DeltaChangeTypes.CHANGE, CharmChangeDelta]
  | [DeltaEntityTypes.CHARM, DeltaChangeTypes.REMOVE, CharmChangeDelta]
  | [DeltaEntityTypes.UNIT, DeltaChangeTypes.CHANGE, UnitChangeDelta]
  | [DeltaEntityTypes.UNIT, DeltaChangeTypes.REMOVE, UnitChangeDelta]
  | [DeltaEntityTypes.MACHINE, DeltaChangeTypes.CHANGE, MachineChangeDelta]
  | [DeltaEntityTypes.MACHINE, DeltaChangeTypes.REMOVE, MachineChangeDelta]
  | [DeltaEntityTypes.MODEL, DeltaChangeTypes.CHANGE, ModelChangeDelta]
  | [DeltaEntityTypes.RELATION, DeltaChangeTypes.CHANGE, RelationChangeDelta]
  | [DeltaEntityTypes.RELATION, DeltaChangeTypes.REMOVE, RelationChangeDelta];

export enum DeltaEntityTypes {
  ACTION = "action",
  ANNOTATION = "annotation",
  APPLICATION = "application",
  CHARM = "charm",
  MACHINE = "machine",
  MODEL = "model",
  RELATION = "relation",
  UNIT = "unit",
}

export enum DeltaChangeTypes {
  CHANGE = "change",
  REMOVE = "remove",
}

export enum ReduxDeltaEntityTypes {
  ACTIONS = "actions",
  ANNOTATIONS = "annotations",
  APPLICATIONS = "applications",
  CHARMS = "charms",
  MACHINES = "machines",
  MODEL = "model",
  RELATIONS = "relations",
  UNITS = "units",
}

export type DeltaMessageData =
  | ActionChangeDelta
  | AnnotationChangeDelta
  | ApplicationChangeDelta
  | CharmChangeDelta
  | UnitChangeDelta
  | MachineChangeDelta
  | ModelChangeDelta
  | RelationChangeDelta;

export interface ModelData {
  actions: ActionData;
  annotations: AnnotationData;
  applications: ApplicationData;
  charms: ModelCharmData;
  machines: MachineData;
  model: ModelInfo;
  relations: RelationData;
  units: UnitData;
}

export interface ModelInfo extends ModelChangeDelta {
  "cloud-tag": string;
  region?: string;
  type: string;
  version: string;
}

export interface AnnotationInfo {
  [annotationName: string]: string;
}

interface AnnotatedApplicationInfo extends ApplicationChangeDelta {
  "unit-count"?: number;
}

export type ApplicationInfo =
  | AnnotatedApplicationInfo
  // It's possible the unit count is returned before the application info in
  // which case only the unit count will exist in the store.
  | {
      "unit-count": number;
    };

// Shared Types

type IPAddress = string;
type UnitId = string;
type NumberAsString = string;
type Life = "alive" | "dead" | "dying" | "";
type ISO8601Date = string;
type DeprecatedString = string;
export interface Status {
  // See https://github.com/juju/juju/blob/develop/core/status/status.go
  // For the possible status values for `current`.
  // Possible statuses differ by entity type.
  current: string;
  message: string;
  since?: ISO8601Date;
  version: string;
  data?: { [key: string]: unknown };
  err?: string;
}
type Config = { [key: string]: string | boolean };
type LXDProfile = {
  config?: Config;
  description?: string;
  devices?: { [key: string]: { [key: string]: string } };
} | null;

// Delta Types

export interface ActionChangeDelta {
  "model-uuid": string;
  id: NumberAsString;
  receiver: UnitId;
  name: string;
  status: string;
  message: string;
  parameters?: { [key: string]: string };
  results?: {
    // Known values, add more as known.
    Code: NumberAsString;
    Stderr: string;
    [key: string]: string;
  };
  enqueued: ISO8601Date;
  started: ISO8601Date;
  completed: ISO8601Date;
}

export interface AnnotationChangeDelta {
  "model-uuid": string;
  tag: string; // application-etcd
  annotations: { [annotationName: string]: string };
}

export interface ApplicationChangeDelta {
  "charm-url": string;
  constraints: { [key: string]: string };
  exposed: boolean;
  life: Life;
  "min-units": number;
  "model-uuid": string;
  name: string;
  "owner-tag": string;
  status?: WorkloadStatus;
  subordinate: boolean;
  "workload-version": string;
}

export interface CharmChangeDelta {
  "model-uuid": string;
  "charm-url": string;
  "charm-version": string;
  life: Life;
  profile: LXDProfile;
  config?: Config;
}

export interface MachineChangeDelta {
  addresses: AddressData[] | null;
  "agent-status": MachineAgentStatus;
  "container-type": string;
  "hardware-characteristics"?: HardwareCharacteristics;
  "has-vote": boolean;
  id: NumberAsString;
  "instance-id": string;
  "instance-status": MachineAgentStatus;
  jobs: ["JobHostUnits"] | ["JobManageModel"];
  life: Life;
  "model-uuid": string;
  series: string;
  "supported-containers": ["none" | "lxd" | "kvm"] | null;
  "supported-containers-known": boolean;
  "wants-vote": boolean;
}

export interface MachineAgentStatus extends Status {
  current: "down" | "error" | "pending" | "running" | "started" | "stopped";
}

export interface AddressData {
  value: IPAddress;
  type: "ipv4" | "ipv6";
  scope: "public" | "local-cloud" | "local-fan" | "local-machine";
}

export interface HardwareCharacteristics {
  arch: string;
  mem: number;
  "root-disk": number;
  "cpu-cores": number;
  "cpu-power": number;
  "availability-zone": string;
}

export interface ModelChangeDelta {
  "model-uuid": string;
  name: string;
  life: Life;
  owner: string;
  "controller-uuid": string;
  "is-controller": boolean;
  config: Config;
  status: ModelAgentStatus;
  constraints: { [key: string]: unknown };
  sla: ModelSLAInfo;
}

export interface ModelAgentStatus extends Status {
  current: "available" | "busy" | "";
}

export interface RelationChangeDelta {
  "model-uuid": string;
  key: string;
  id: number;
  endpoints: Endpoint[];
}

export interface EndpointRelation {
  name: string;
  role: "peer" | "requirer" | "provider";
  interface: string;
  optional: boolean;
  limit: number;
  scope: "global" | "container";
}

export interface Endpoint {
  "application-name": string;
  relation: EndpointRelation;
}

export interface UnitChangeDelta {
  "agent-status": UnitAgentStatus;
  "charm-url": string;
  "machine-id": NumberAsString;
  "model-uuid": string;
  "port-ranges":
    | {
        "from-port": number;
        "to-port": number;
        protocol: string;
      }[]
    | null;
  "private-address": DeprecatedString;
  "public-address": DeprecatedString;
  "workload-status": WorkloadStatus;
  application: string;
  life: Life;
  name: string;
  ports:
    | {
        protocol: string;
        number: number;
      }[]
    | []
    | null;
  principal: string; // If subordinate is true this will have the parent.
  series: string;
  subordinate: boolean;
}

export interface UnitAgentStatus extends Status {
  current:
    | "allocating"
    | "executing"
    | "failed"
    | "idle"
    | "lost"
    | "rebooting";
}

export interface WorkloadStatus extends Status {
  current:
    | "active"
    | "blocked"
    | "maintenance"
    | "terminated"
    | "unknown"
    | "unset"
    | "waiting";
}

export type FullStatusAnnotations = Record<
  string,
  AnnotationsAdditionalProperties
>;

export type FullStatusWithAnnotations = FullStatus & {
  annotations?: FullStatusAnnotations;
};

export type Facades = {
  action?: ActionV7;
  allWatcher?: AllWatcherV3;
  annotations?: AnnotationsV2;
  application?: ApplicationV15;
  charms?: CharmsV6;
  client?: ClientV6;
  cloud?: CloudV7;
  controller?: ControllerV9;
  modelManager?: ModelManagerV9;
  pinger?: PingerV1;
  jimM?: InstanceType<typeof JIMMV2>;
};

export type ConnectionWithFacades = Connection & {
  facades: Facades;
};
