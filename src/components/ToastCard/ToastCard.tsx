import type { PropsWithChildren } from "react";
import type { Renderable, Toast, ValueOrFunction } from "react-hot-toast";
import reactHotToast from "react-hot-toast";

import "./_toast-card.scss";

export type ToastInstance = {
  createdAt: number;
  duration?: number | undefined;
  id: string;
  message: ValueOrFunction<Renderable, Toast>;
  pauseDuration: number;
  type: string;
  visible: boolean;
};

type Props = {
  toastInstance: ToastInstance;
  type: "positive" | "caution" | "negative";
  undo?: () => void;
} & PropsWithChildren;

export default function ToastCard({
  children,
  toastInstance,
  type,
  undo,
}: Props) {
  let iconName;
  switch (type) {
    case "positive":
      iconName = "success";
      break;
    case "caution":
      iconName = "warning";
      break;
    case "negative":
      iconName = "error";
      break;
    default:
      break;
  }

  const handleClose = (id: string) => {
    reactHotToast.remove(id);
  };

  return (
    <div
      className="toast-card"
      data-type={type}
      role="status"
      aria-live="polite"
      data-testid="toast-card"
    >
      <div className="toast-card__body">
        {iconName && <i className={`p-icon--${iconName}`}>{iconName}</i>}
        <div className="toast-card__message">{children}</div>
        <i
          className="p-icon--close"
          onClick={() => handleClose(toastInstance.id)}
          onKeyUp={() => handleClose(toastInstance.id)}
          role="button"
          tabIndex={0}
        >
          Close
        </i>
      </div>
      {undo && (
        <footer className="toast-card__undo">
          <button
            onClick={() => {
              undo();
              handleClose(toastInstance.id);
            }}
            className="p-button--base"
          >
            Undo
          </button>
        </footer>
      )}
    </div>
  );
}
