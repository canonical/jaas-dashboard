import Convert from "ansi-to-html";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { TestId } from "./types";

type Props = {
  content: string;
  helpMessage: ReactNode;
  showHelp: boolean;
  setShouldShowHelp: (showHelp: boolean) => void;
};

const DEFAULT_HEIGHT = 300;
// 20 is a magic number, sometimes the browser stops firing the drag at
// an inopportune time and the element isn't left completely closed.
const CONSIDER_CLOSED = 20;
const HELP_HEIGHT = 50;
const dragHandles = ["webcli__output-dragarea", "webcli__output-handle"];

const WebCLIOutput = ({
  content,
  helpMessage,
  showHelp,
  setShouldShowHelp,
}: Props) => {
  const convert = new Convert();

  const resizeDeltaY = useRef(0);
  const [height, setHeight] = useState(1);

  useEffect(() => {
    const resize = (clientY: number) => {
      const viewPortHeight = window.innerHeight;
      const mousePosition = clientY + 40; // magic number
      const newHeight = viewPortHeight - mousePosition + resizeDeltaY.current;
      const maximumOutputHeight = viewPortHeight - 100; // magic number.
      if (newHeight < maximumOutputHeight && newHeight >= 10) {
        setHeight(newHeight);
      }
    };

    const resizeMouse = (e: MouseEvent) => {
      e.preventDefault();
      resize(e.clientY);
    };

    const resizeTouch = (e: TouchEvent) => {
      e.preventDefault();
      resize(e.touches[0].clientY);
    };

    const addMouseResizeListener = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!dragHandles.includes(target?.classList.value)) {
        return;
      }
      resizeDeltaY.current = e.offsetY ?? 0;
      document.addEventListener("mousemove", resizeMouse);
    };

    const addTouchResizeListener = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!dragHandles.includes(target?.classList.value)) {
        return;
      }
      const rect = target.getBoundingClientRect();
      if (typeof e.targetTouches?.[0]?.pageY === "number") {
        resizeDeltaY.current = e.targetTouches[0].pageY;
      } else if (typeof rect?.top === "number") {
        resizeDeltaY.current = 0 - rect.top;
      } else {
        resizeDeltaY.current = 0;
      }
      document.addEventListener("touchmove", resizeTouch, { passive: false });
    };

    const removeListener = () => {
      document.removeEventListener("mousemove", resizeMouse);
      document.removeEventListener("touchmove", resizeTouch);
    };

    window.addEventListener("mousedown", addMouseResizeListener);
    window.addEventListener("mouseup", removeListener);
    window.addEventListener("touchstart", addTouchResizeListener, {
      passive: false,
    });
    window.addEventListener("touchend", removeListener, { passive: false });
    return () => {
      window.removeEventListener("mousedown", addMouseResizeListener);
      window.removeEventListener("mouseup", removeListener);
      window.removeEventListener("touchstart", addTouchResizeListener);
      window.removeEventListener("touchend", removeListener);
    };
  }, []);

  useEffect(() => {
    if (showHelp) {
      setHeight(HELP_HEIGHT);
    }
  }, [showHelp]);

  useEffect(() => {
    if (height < CONSIDER_CLOSED) {
      setShouldShowHelp(false);
    }
  }, [height, setShouldShowHelp]);

  useEffect(() => {
    // New content is coming in, so check if we're collapsed and if we
    // are then open it back up.
    if (
      content.length > 1 &&
      height <= HELP_HEIGHT &&
      height !== DEFAULT_HEIGHT
    ) {
      setHeight(DEFAULT_HEIGHT);
    }
    // We can't have height as a dependency because we don't want this to run
    // when the height changes, only when the content comes in.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [content]);

  return (
    <div className="webcli__output" style={{ height: `${height}px` }}>
      <div className="webcli__output-dragarea" aria-hidden={true}>
        <div className="webcli__output-handle"></div>
      </div>
      <pre
        className="webcli__output-content"
        style={{ height: `${height}px` }}
        data-testid={TestId.CONTENT}
      >
        {showHelp || !content ? (
          <code data-testid={TestId.HELP}>{helpMessage}</code>
        ) : (
          <code
            data-testid={TestId.CODE}
            dangerouslySetInnerHTML={{ __html: convert.toHtml(content) }}
          />
        )}
      </pre>
    </div>
  );
};

export default WebCLIOutput;
