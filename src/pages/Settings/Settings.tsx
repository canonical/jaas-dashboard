import { Switch } from "@canonical/react-components";

import FadeIn from "animations/FadeIn";
import Header from "components/Header/Header";
import useLocalStorage from "hooks/useLocalStorage";
import useWindowTitle from "hooks/useWindowTitle";
import BaseLayout from "layout/BaseLayout/BaseLayout";

import "./settings.scss";

export enum Label {
  DISABLE_TOGGLE = "Disable analytics",
}

export const DISABLE_ANALYTICS_KEY = "disableAnalytics";

export default function Settings() {
  useWindowTitle("Settings");

  const [disableAnalytics, setDisableAnalytics] = useLocalStorage(
    DISABLE_ANALYTICS_KEY,
    false
  );

  return (
    <BaseLayout>
      <Header>
        <span className="l-content settings__header">Settings</span>
      </Header>
      <FadeIn isActive={true}>
        <div className="l-content settings">
          <div className="settings__toggles">
            <div className="settings__toggles-group">
              <Switch
                label={Label.DISABLE_TOGGLE}
                defaultChecked={disableAnalytics}
                onChange={() => {
                  setDisableAnalytics(!disableAnalytics);
                }}
              />
              <div className="settings__toggles-info">
                You will need to refresh your browser for this setting to take
                effect.
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </BaseLayout>
  );
}
