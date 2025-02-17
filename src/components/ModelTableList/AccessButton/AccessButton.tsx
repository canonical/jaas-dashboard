import BaseAccessButton from "components/AccessButton";

import { Label } from "./types";

type Props = {
  modelName: string;
};

const AccessButton = (props: Props) => {
  return (
    <BaseAccessButton {...props} dense className="model-access">
      {Label.ACCESS_BUTTON}
    </BaseAccessButton>
  );
};

export default AccessButton;
