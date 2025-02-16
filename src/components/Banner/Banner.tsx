import classnames from "classnames";
import type { JSX, ReactNode } from "react";
import { useState, useEffect } from "react";

import "./_banner.scss";
import { Label } from "./types";

type Props = {
  isActive: boolean;
  children: ReactNode;
  variant: "positive" | "caution" | "negative";
};

export default function Banner({
  isActive,
  children,
  variant,
  ...props
}: Props): JSX.Element {
  const [bannerClosed, setBannerClosed] = useState(false);

  // Open banner every time banner variant changes
  useEffect(() => {
    setBannerClosed(false);
  }, [variant]);

  return (
    <div
      className="banner"
      data-active={isActive && !bannerClosed}
      data-variant={variant}
      {...props}
    >
      {children}
      <button
        className="banner__close"
        onClick={() => {
          setBannerClosed(true);
        }}
      >
        <i
          className={classnames("p-icon--close", {
            "is-light": variant === "positive",
          })}
        >
          {Label.CLOSE}
        </i>
      </button>
    </div>
  );
}
