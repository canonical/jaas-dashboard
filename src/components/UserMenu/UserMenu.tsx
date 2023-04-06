import { useEffect } from "react";
import { useSelector, useStore } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import classNames from "classnames";
import { getActiveUserTag, getWSControllerURL } from "store/general/selectors";

import useAnalytics from "hooks/useAnalytics";
import { thunks as appThunks } from "store/app";
import { extractOwnerName } from "store/juju/utils/models";
import { useAppDispatch } from "store/store";
import urls from "urls";

import { actions } from "store/ui";
import { isUserMenuActive } from "store/ui/selectors";

import "./_user-menu.scss";

const UserMenu = () => {
  const sendAnalytics = useAnalytics();
  const dispatch = useAppDispatch();
  const store = useStore();
  const getState = store.getState;
  const activeUser = getActiveUserTag(
    getState(),
    useSelector(getWSControllerURL)
  );
  const isActive = useSelector(isUserMenuActive) || false;

  useEffect(() => {
    if (isActive) {
      sendAnalytics({
        category: "User",
        action: "Opened user menu",
      });
    }
  }, [isActive, sendAnalytics]);

  const toggleUserMenuActive = () =>
    dispatch(actions.userMenuActive(!isActive));

  return (
    <>
      {activeUser && (
        <div
          className={classNames("user-menu", {
            "is-active": isActive,
          })}
        >
          <div
            className="user-menu__header"
            onClick={toggleUserMenuActive}
            onKeyPress={toggleUserMenuActive}
            role="button"
            tabIndex={0}
          >
            <i className="p-icon--user is-light"></i>
            <span className="user-menu__name">
              {activeUser ? extractOwnerName(activeUser) : ""}
            </span>
            <i className="p-icon--chevron-up is-light"></i>
          </div>
          <ul className="p-list user-menu__options">
            <li className="p-list__item">
              <NavLink
                className={({ isActive }) =>
                  classNames("user-menu__link p-list__link", {
                    "is-selected": isActive,
                  })
                }
                to={urls.settings}
              >
                Settings
              </NavLink>
            </li>
            <li className="p-list__item">
              <Link
                className="user-menu__link"
                to={urls.index}
                onClick={() => dispatch(appThunks.logOut())}
              >
                Log out
              </Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
};

export default UserMenu;
