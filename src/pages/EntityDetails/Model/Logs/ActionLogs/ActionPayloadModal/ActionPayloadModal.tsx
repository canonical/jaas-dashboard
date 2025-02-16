import type { ActionResult } from "@canonical/jujulib/dist/api/facades/action/ActionV7";
import {
  Button,
  CodeSnippet,
  CodeSnippetBlockAppearance,
  Modal,
} from "@canonical/react-components";
import type { JSX } from "react";

import { copyToClipboard } from "components/utils";

import { Label } from "./types";

type Props = {
  payload: ActionResult["output"] | null;
  onClose: () => void;
};

const ActionPayloadModal = ({
  payload,
  onClose,
}: Props): JSX.Element | null => {
  if (!payload) {
    return null;
  }
  const json = JSON.stringify(payload, null, 2);
  return (
    <Modal
      close={onClose}
      title={Label.TITLE}
      buttonRow={
        <Button appearance="neutral" onClick={() => copyToClipboard(json)}>
          {Label.COPY}
        </Button>
      }
      data-testid="action-payload-modal"
    >
      <CodeSnippet
        blocks={[
          {
            appearance: CodeSnippetBlockAppearance.NUMBERED,
            wrapLines: true,
            code: json,
          },
        ]}
      />
    </Modal>
  );
};

export default ActionPayloadModal;
