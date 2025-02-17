import { AppAside, Spinner } from "@canonical/react-components";
import type {
  AppAsideProps,
  PanelProps,
  PropsWithSpread,
} from "@canonical/react-components";
import classnames from "classnames";
import { useAnimate, usePresence } from "framer-motion";
import type { JSX } from "react";
import { useEffect, type PropsWithChildren } from "react";

import "./_aside.scss";

export type Props = PropsWithSpread<
  {
    className?: string;
    width?: "wide" | "narrow";
    pinned?: boolean;
    loading?: boolean;
    panelProps?: PanelProps;
    isSplit?: boolean;
    animateMount?: boolean;
  },
  AppAsideProps & PropsWithChildren
>;

export default function Aside({
  animateMount = true,
  children,
  className,
  width,
  loading = false,
  isSplit = false,
  ...props
}: Props): JSX.Element {
  const [scope, animate] = useAnimate<HTMLElement>();
  const [isPresent, safeToRemove] = usePresence();

  useEffect(() => {
    if (isPresent) {
      const enterAnimation = async () => {
        await animate([[scope.current, { x: 0 }, { type: "tween" }]]);
      };
      try {
        void enterAnimation();
      } catch (error) {
        // Don't need to alert the user if the animation fails.
      }
    } else {
      const exitAnimation = async () => {
        await animate(scope.current, { x: "100%" });
        safeToRemove();
      };
      try {
        void exitAnimation();
      } catch (error) {
        // Don't need to alert the user if the animation fails.
      }
    }
  }, [animate, animateMount, isPresent, safeToRemove, scope]);

  return (
    <AppAside
      className={classnames(className, {
        "is-narrow": width === "narrow",
        "is-wide": width === "wide",
        "is-split": isSplit,
        "l-aside--initially-offscreen": animateMount,
      })}
      forwardRef={scope}
      {...props}
    >
      {!loading ? (
        <>{children}</>
      ) : (
        <div className="loading">
          <Spinner />
        </div>
      )}
    </AppAside>
  );
}
