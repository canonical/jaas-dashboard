import type { JSX, ReactNode } from "react";
import { useState } from "react";

import "./_content-reveal.scss";

type Props = {
  title: string | ReactNode;
  children: JSX.Element;
  openByDefault?: boolean;
};

export default function ContentReveal({
  title,
  openByDefault = false,
  children,
}: Props) {
  const [isOpen, setIsOpen] = useState(openByDefault);

  function handleToggle() {
    setIsOpen(!isOpen);
  }

  const iconName = isOpen ? "minus" : "plus";

  return (
    <div className="content-reveal" data-open={isOpen}>
      <div
        className="content-reveal__header"
        onClick={() => handleToggle()}
        onKeyDown={() => handleToggle()}
        role="button"
        tabIndex={0}
      >
        <i className={`p-icon--${iconName}`}></i>
        <div className="content-reveal__title">{title}</div>
      </div>
      <div className="content-reveal__content" aria-hidden={!isOpen}>
        {children}
      </div>
    </div>
  );
}
