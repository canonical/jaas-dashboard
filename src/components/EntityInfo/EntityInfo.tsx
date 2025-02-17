import type { JSX, ReactNode } from "react";

import TruncatedTooltip from "components/TruncatedTooltip";

import "./_entity-info.scss";

type Props = {
  data: { [key: string]: ReactNode };
};

export default function EntityInfo({ data }: Props): JSX.Element {
  return (
    <div className="entity-info__grid">
      {Object.entries(data).map(([label, value]) => {
        return (
          <div className="entity-info__grid-item" key={label}>
            <h4 className="p-muted-heading">{label}</h4>
            {typeof value === "string" || typeof value === "number" ? (
              <TruncatedTooltip message={value} element="p">
                {value}
              </TruncatedTooltip>
            ) : (
              <p>{value}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
