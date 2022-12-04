/*
  Redux middleware that gates every request on authentication unless an action
  has been allowed.
*/

import { actionsList } from "app/action-types";
import { isLoggedIn } from "app/selectors";

const actionAllowlist = [
  "POPULATE_MISSING_ALLWATCHER_DATA",
  "PROCESS_ALL_WATCHER_DELTAS",
  "STORE_LOGIN_ERROR",
  "STORE_CONFIG",
  "STORE_USER_PASS",
  "STORE_VERSION",
  "UPDATE_CONTROLLER_CONNECTION",
  "UPDATE_CONTROLLER_LIST",
  "UPDATE_JUJU_API_INSTANCE",
  "UPDATE_PINGER_INTERVAL_ID",
  "LOG_OUT",
  "CLEAR_CONTROLLER_DATA",
  "CLEAR_MODEL_DATA",
  "STORE_VISIT_URL",
  "TOGGLE_USER_MENU",
  "SIDENAV_COLLAPSED",
  actionsList.connectAndPollControllers,
];

const thunkAllowlist = ["connectAndStartPolling", "logOut"];

function error(name, wsControllerURL) {
  console.log(
    "unable to perform action:",
    name,
    "user not authenticated for:",
    wsControllerURL
  );
}

const checkLoggedIn = (state, wsControllerURL) => {
  if (!wsControllerURL) {
    console.error("unable to determine logged in status");
  }
  return isLoggedIn(wsControllerURL, state);
};

/**
  Redux middleware to enable gating actions on the respective controller
  authentication.
  @param {Object} action The typical Redux action or thunk to execute
  @param {Object} options Any options that this checker needs to perform an
    appropriate auth check.
      wsControllerURL: The full controller websocket url that the controller
        is stored under in redux in order to determine it's logged in status.
*/
// eslint-disable-next-line import/no-anonymous-default-export
export default ({ getState }) =>
  (next) =>
  async (action) => {
    const state = getState();
    const wsControllerURL = action.payload?.wsControllerURL;

    // If the action is a function then it's probably a thunk.
    if (typeof action === "function") {
      if (
        thunkAllowlist.includes(action.NAME) ||
        checkLoggedIn(state, wsControllerURL)
      ) {
        // Await the next to support async thunks
        await next(action);
        return;
      } else {
        error(action.NAME, wsControllerURL);
      }
    } else {
      if (
        actionAllowlist.includes(action.type) ||
        checkLoggedIn(state, wsControllerURL)
      ) {
        next(action);
        return;
      } else {
        error(action.type, wsControllerURL);
      }
    }
  };
