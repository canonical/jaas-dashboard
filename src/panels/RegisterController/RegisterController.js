import { useState } from "react";
import { useDispatch, useStore } from "react-redux";
import { useNavigate } from "react-router-dom";

import { connectAndStartPolling } from "app/actions";
import bakery from "app/bakery";

import classNames from "classnames";

import useLocalStorage from "hooks/useLocalStorage";

import Aside from "components/Aside/Aside";
import PanelHeader from "components/PanelHeader/PanelHeader";

import "./register-controller.scss";

export default function RegisterController() {
  const [formValues, setFormValues] = useState({});
  const dispatch = useDispatch();
  const reduxStore = useStore();
  const [additionalControllers, setAdditionalControllers] = useLocalStorage(
    "additionalControllers",
    []
  );
  const navigate = useNavigate();

  function handleRegisterAController(e) {
    e.preventDefault();
    // XXX Validate form values
    additionalControllers.push([
      `wss://${formValues.wsControllerHost}/api`, // wsControllerURL
      { user: formValues.username, password: formValues.password }, // credentials
      null, // bakery
      formValues.identityProviderAvailable, // identityProviderAvailable
      true, // additional controller
    ]);
    setAdditionalControllers(additionalControllers);
    dispatch(connectAndStartPolling(reduxStore, bakery));
    // Close the panel
    navigate("/controllers");
  }

  function handleInputChange(e) {
    const newFormValues = { ...formValues };
    newFormValues[e.target.name] =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormValues(newFormValues);
  }

  function generateTheControllerLink(controllerIP) {
    if (!controllerIP) {
      return "the controller";
    }
    const dashboardLink = `https://${controllerIP}/dashboard`;
    return (
      <a href={dashboardLink} target="_blank" rel="noopener noreferrer">
        the controller
      </a>
    );
  }

  return (
    <Aside>
      <div className="p-panel register-controller">
        <PanelHeader title={<h4>Register a controller</h4>} />
        <div className="p-panel__content">
          <p className="p-form-help-text">
            Information can be retrieved using the{" "}
            <code>juju show-controller</code> command.
          </p>
          <form
            className="p-form p-form--stacked"
            onSubmit={handleRegisterAController}
          >
            <div className="p-form__group row">
              <div className="col-2">
                <label
                  htmlFor="controller-name"
                  className="p-form__label is-required"
                >
                  Name
                </label>
              </div>

              <div className="col-10">
                <div className="p-form__control">
                  <input
                    type="text"
                    id="controller-name"
                    name="controllerName"
                    onChange={handleInputChange}
                    required={true}
                  />
                  <p className="p-form-help-text">
                    Must be a valid alpha-numeric Juju controller name. <br />
                    e.g. production-controller-aws
                  </p>
                </div>
              </div>
            </div>

            <div className="p-form__group row">
              <div className="col-2">
                <label htmlFor="host" className="p-form__label is-required">
                  Host
                </label>
              </div>

              <div className="col-10">
                <div className="p-form__control">
                  <input
                    type="text"
                    id="host"
                    name="wsControllerHost"
                    onChange={handleInputChange}
                    required={true}
                  />
                  <p className="p-form-help-text">
                    You'll typically want to use the public IP:Port address for
                    the controller. <br />
                    e.g. 91.189.88.181:17070
                  </p>
                </div>
              </div>
            </div>

            <div className="p-form__group row">
              <div className="col-2">
                <label htmlFor="username" className="p-form__label">
                  Username
                </label>
              </div>

              <div className="col-10">
                <div className="p-form__control">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    onChange={handleInputChange}
                  />
                  <p className="p-form-help-text">
                    The username you use to access the controller.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-form__group row">
              <div className="col-2">
                <label htmlFor="password" className="p-form__label">
                  Password
                </label>
              </div>

              <div className="col-10">
                <div className="p-form__control">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    onChange={handleInputChange}
                  />
                  <p className="p-form-help-text">
                    The password will be what you used when running{" "}
                    <code>juju register</code> or if unchanged from the default
                    it can be retrieved by running <code>juju dashboard</code>.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={classNames("p-form__group row", {
                "u-hide": formValues.username && formValues.password,
              })}
            >
              <div className="col-10 col-start-large-3">
                <input
                  type="checkbox"
                  id="identityProviderAvailable"
                  name="identityProvider"
                  defaultChecked={false}
                  onChange={handleInputChange}
                />
                <label htmlFor="identityProviderAvailable">
                  An identity provider is available.{" "}
                </label>
                <div className="p-form-help-text identity-provider">
                  If you provided a username and password this should be left
                  unchecked.
                </div>
              </div>
            </div>
            <div className="p-form__group row">
              <div className="col-10 col-start-large-3">
                <i className="p-icon--warning"></i>
                <div className="controller-link-message">
                  Visit{" "}
                  {generateTheControllerLink(formValues?.wsControllerHost)} to
                  accept the certificate on this controller to enable a secure
                  connection
                </div>
              </div>
            </div>
            <div className="p-form__group row">
              <div className="col-10 col-start-large-3">
                <input
                  type="checkbox"
                  id="certificateHasBeenAccepted"
                  name="certificateAccepted"
                  defaultChecked={false}
                  onChange={handleInputChange}
                  required={true}
                />
                <label htmlFor="certificateHasBeenAccepted">
                  The SSL certificate, if any, has been accepted.{" "}
                  <span className="required-star">*</span>
                </label>
              </div>
            </div>

            <hr />

            <div className="row register-a-controller__submit-segment">
              <div className="col-9">
                <p className="p-form-help-text">
                  The credentials are stored locally in your browser and can be
                  cleared on log-out.
                </p>
              </div>
              <div className="col-3">
                <button
                  className="p-button--positive"
                  type="submit"
                  disabled={!formValues.certificateAccepted}
                >
                  Add Controller
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Aside>
  );
}
