import type {
  ButtonProps,
  ContextualMenuProps,
  MenuLink,
} from "@canonical/react-components";
import {
  ContextualMenu,
  Icon,
  Spinner,
  Tooltip,
  Modal,
  ActionButton,
  Button,
  usePortal,
} from "@canonical/react-components";
import type { JSX, ReactNode } from "react";
import { useId, useState } from "react";
import { useParams } from "react-router";

import type { EntityDetailsRoute } from "components/Routes";
import SecretForm from "components/secrets/SecretForm";
import SecretLabel from "components/secrets/SecretLabel";
import useCanManageSecrets from "hooks/useCanManageSecrets";
import { useListSecrets } from "juju/api-hooks";
import {
  getModelUUIDFromList,
  getSecretsErrors,
  getSecretsLoading,
  getModelSecrets,
  getSecretsLoaded,
} from "store/juju/selectors";
import { useAppSelector } from "store/store";
import { secretIsAppOwned } from "utils";

import { Label } from "./types";

type Props = {
  setValue: (secret: string) => void;
};

export default function SecretsPicker({ setValue }: Props): JSX.Element {
  const { userName, modelName } = useParams<EntityDetailsRoute>();
  const [saving, setSaving] = useState<boolean>(false);
  const formId = useId();
  const modelUUID = useAppSelector(getModelUUIDFromList(modelName, userName));
  const secretsErrors = useAppSelector((state) =>
    getSecretsErrors(state, modelUUID),
  );
  const listSecrets = useListSecrets(userName, modelName);
  const secretsLoading = useAppSelector((state) =>
    getSecretsLoading(state, modelUUID),
  );
  const secretsLoaded = useAppSelector((state) =>
    getSecretsLoaded(state, modelUUID),
  );
  const secrets = useAppSelector((state) => getModelSecrets(state, modelUUID));
  const canManageSecrets = useCanManageSecrets();
  const { openPortal, closePortal, isOpen, Portal } = usePortal({
    programmaticallyOpen: true,
  });

  let links: ContextualMenuProps<unknown>["links"] = null;
  let dropdownContent: ReactNode = null;
  if (secretsLoading && !secretsLoaded) {
    dropdownContent = (
      <div className="u-align--center">
        <Spinner aria-label={Label.LOADING} />
      </div>
    );
  } else if (secretsErrors) {
    dropdownContent = secretsErrors;
  } else if (!canManageSecrets && !secrets?.length) {
    dropdownContent = Label.NONE;
  } else {
    const secretLinks: MenuLink<ButtonProps> | undefined = secrets?.reduce<
      ButtonProps[]
    >((links, secret) => {
      if (!secretIsAppOwned(secret)) {
        links.push({
          children: <SecretLabel secret={secret} />,
          onClick: () => setValue(secret.uri),
        });
      }
      return links;
    }, []);
    if (canManageSecrets) {
      const addButton: MenuLink<ButtonProps> = {
        children: Label.BUTTON_ADD,
        onClick: openPortal,
      };
      if (secretLinks?.length) {
        links = [[addButton], secretLinks];
      } else {
        links = [addButton];
      }
    } else {
      links = secretLinks ?? [];
    }
  }

  return (
    <>
      <ContextualMenu
        dropdownClassName="p-contextual-menu__dropdown--over-panel prevent-panel-close"
        links={links ?? []}
        onToggleMenu={(open) => {
          open && listSecrets();
        }}
        position="right"
        scrollOverflow
        toggleAppearance="base"
        toggleClassName="has-icon u-no-margin--bottom is-small config-input__pick-secret"
        toggleLabel={
          <Tooltip message={Label.CHOOSE_SECRET}>
            <Icon name="security">{Label.CHOOSE_SECRET}</Icon>
          </Tooltip>
        }
      >
        {dropdownContent}
      </ContextualMenu>
      {isOpen ? (
        <Portal>
          <Modal
            className="p-modal--min-width prevent-panel-close"
            close={() => {
              closePortal();
            }}
            title={Label.MODAL_TITLE}
          >
            <SecretForm
              formId={formId}
              onSuccess={(secretURI) => {
                setSaving(false);
                secretURI && setValue(secretURI);
                closePortal();
              }}
              setSaving={setSaving}
            />
            <div>
              <Button onClick={closePortal}>{Label.BUTTON_CANCEL}</Button>
              <ActionButton
                appearance="positive"
                disabled={saving}
                form={formId}
                loading={saving}
                type="submit"
              >
                {Label.BUTTON_SUBMIT}
              </ActionButton>
            </div>
          </Modal>
        </Portal>
      ) : null}
    </>
  );
}
