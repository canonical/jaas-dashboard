import type { ButtonProps } from "@canonical/react-components";
import type { PropsWithChildren } from "react";

export type Props = {
  displayIcon?: boolean;
  modelName?: string;
} & PropsWithChildren &
  Partial<ButtonProps>;
