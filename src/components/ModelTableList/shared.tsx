import { Icon, Tooltip } from "@canonical/react-components";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

import awsLogo from "static/images/logo/cloud/aws.svg";
import azureLogo from "static/images/logo/cloud/azure.svg";
import gceLogo from "static/images/logo/cloud/gce.svg";
import kubernetesLogo from "static/images/logo/cloud/kubernetes.svg";
import { ModelData, ModelDataWithControllerName } from "store/juju/types";

import {
  extractCloudName,
  extractCredentialName,
} from "store/juju/utils/models";
import { QueryParamConfig, SetQuery } from "use-query-params";

/**
  Generates the model details link for the table cell. If no ownerTag can be
  provided then it'll return raw text for the model name.
  @param modelName The name of the model.
  @param ownerTag The ownerTag of the model.
  @param label The contents of the link.
  @returns The React component for the link.
*/
export function generateModelDetailsLink(
  modelName: string,
  ownerTag: string,
  label: ReactNode,
  view?: string,
  className?: string
) {
  // Because we get some data at different times based on the multiple API calls
  // we need to check for their existence and supply reasonable fallbacks if it
  // isn't available. Once we have a single API call for all the data this check
  // can be removed.
  if (!ownerTag) {
    // We will just return an unclickable name until we get an owner tag as
    // without it we can't create a reliable link.
    return label;
  }
  // If the owner isn't the logged in user then we need to use the
  // fully qualified path name.
  let modelDetailsPath = `/models/${ownerTag.replace(
    "user-",
    ""
  )}/${modelName}`;
  if (view) {
    modelDetailsPath = `${modelDetailsPath}?activeView=${view}`;
  }
  return (
    <Link to={modelDetailsPath} className={className}>
      {label}
    </Link>
  );
}

/**
  Used to fetch the values from status as it won't be defined when the
  modelInfo data is.
  @param status The status for the model.
  @param key The key to fetch.
  @returns The computed value for the requested field if defined, or
    an empty string.
*/
export function getStatusValue(
  status: ModelDataWithControllerName,
  key: string,
  extra?: string
) {
  let returnValue: ReactNode = "";
  if (typeof status === "object" && status !== null) {
    switch (key) {
      case "summary":
        const applicationKeys = Object.keys(status.applications);
        const applicationCount = applicationKeys.length;
        const machineCount = Object.keys(status.machines).length;
        const unitCount = applicationKeys.reduce((prev, key) => {
          const units = status.applications[key].units || {};
          return prev + Object.keys(units).length;
        }, 0);

        returnValue = (
          <>
            <div className="u-flex">
              <Tooltip
                message="See applications"
                position="top-center"
                className="u-flex--block has-icon"
              >
                {extra
                  ? generateModelDetailsLink(
                      status.model.name,
                      extra,
                      <>
                        <Icon name="applications" />
                        <span>{applicationCount}</span>
                      </>,
                      "apps",
                      "p-link--soft"
                    )
                  : null}
              </Tooltip>
              <Tooltip
                message="Units"
                position="top-center"
                className="u-flex--block has-icon"
              >
                <Icon name="units" />
                <span>{unitCount}</span>
              </Tooltip>
              <Tooltip
                message="See machines"
                position="top-center"
                className="u-flex--block has-icon"
              >
                {extra
                  ? generateModelDetailsLink(
                      status.model.name,
                      extra,
                      <>
                        <Icon name="machines" />
                        <span>{machineCount}</span>
                      </>,
                      "machines",
                      "p-link--soft"
                    )
                  : null}
              </Tooltip>
            </div>
          </>
        );
        break;
      case "cloud-tag":
        returnValue = extractCloudName(status.model["cloud-tag"]);
        break;
      case "region":
        returnValue = status.model.region;
        break;
      case "cloud-credential-tag":
        returnValue = extractCredentialName(
          status.info?.["cloud-credential-tag"]
        );
        break;
      case "controllerUuid":
        returnValue = status.info?.["controller-uuid"];
        break;
      case "controllerName":
        returnValue = status.info?.controllerName;
        break;
      case "status.since":
        returnValue = status.info?.status?.since?.split("T")[0];
        break;
      default:
        console.log(`unsupported status value key: ${key}`);
        break;
    }
  }
  return returnValue;
}

/**
  Generates the cloud and region info from model data.
  @param model The model data.
  @returns The React element for the model cloud and region cell.
*/
export function generateCloudCell(model: ModelData) {
  let provider = model?.info?.["provider-type"];
  let logo = null;
  switch (provider) {
    case "ec2":
      logo = (
        <img
          src={awsLogo}
          alt="AWS logo"
          className="p-table__logo"
          data-testid="provider-logo"
        />
      );
      break;
    case "gce":
      logo = (
        <img
          src={gceLogo}
          alt="Google Cloud Platform logo"
          className="p-table__logo"
          data-testid="provider-logo"
        />
      );
      break;
    case "azure":
      logo = (
        <img
          src={azureLogo}
          alt="Azure logo"
          className="p-table__logo"
          data-testid="provider-logo"
        />
      );
      break;
    case "kubernetes":
      logo = (
        <img
          src={kubernetesLogo}
          alt="Kubernetes logo"
          className="p-table__logo"
          data-testid="provider-logo"
        />
      );
      break;
  }

  const cloud = (
    <>
      {logo}
      {generateCloudAndRegion(model)}
    </>
  );

  return cloud;
}

/**
  Returns the model cloud and region data formatted as {cloud}/{region}.
  @param model The model data
  @returns The formatted cloud and region data.
*/
export function generateCloudAndRegion(model: ModelData) {
  return `${getStatusValue(model, "cloud-tag")}/${getStatusValue(
    model,
    "region"
  )}`;
}

/**
  Returns the model access button or an alternative value
  @param {Function} setPanelQs A function to set query strings
  @param modelName the name of the model
  @returns The markup for the table cell
*/
export function generateAccessButton(
  setPanelQs: SetQuery<
    Record<
      string,
      QueryParamConfig<string | null | undefined, string | null | undefined>
    >
  >,
  modelName: string
) {
  return (
    <button
      onClick={() => {
        setPanelQs({
          model: modelName,
          panel: "share-model",
        });
      }}
      className="model-access p-button--neutral is-dense"
    >
      Access
    </button>
  );
}
