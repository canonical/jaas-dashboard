import { Button } from "@canonical/react-components";
import { unwrapResult } from "@reduxjs/toolkit";
import reactHotToast from "react-hot-toast";

import ToastCard from "components/ToastCard";
import type { ToastInstance } from "components/ToastCard";
import { thunks as appThunks } from "store/app";
import { useAppDispatch } from "store/store";
import { logger } from "utils/logger";

export enum Label {
  LOGOUT_ERROR = "Error when trying to logout.",
}

const useLogout = () => {
  const dispatch = useAppDispatch();
  return () => {
    dispatch(appThunks.logOut())
      .then(unwrapResult)
      .catch((error) => {
        reactHotToast.custom((t: ToastInstance) => (
          <ToastCard toastInstance={t} type="negative">
            <>
              {Label.LOGOUT_ERROR} Try{" "}
              <Button
                appearance="link"
                onClick={() => window.location.reload()}
              >
                refreshing
              </Button>{" "}
              the page.
            </>
          </ToastCard>
        ));
        logger.error(Label.LOGOUT_ERROR, error);
      });
  };
};

export default useLogout;
