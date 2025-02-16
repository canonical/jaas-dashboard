import type { JSX } from "react";

type Props = {
  message: string;
  children: JSX.Element;
};

export default function NotFound({ message, children }: Props) {
  return (
    <>
      <h1>
        <span role="img" aria-label="Shrug">
          ¯\_(ツ)_/¯
        </span>
      </h1>
      <h2>{message}</h2>
      <div className="not-found__content">{children}</div>
    </>
  );
}
