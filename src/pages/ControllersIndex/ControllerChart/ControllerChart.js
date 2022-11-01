import DonutChart from "components/DonutChart/DonutChart";

import { pluralize } from "app/utils/utils";

import "./_controller-chart.scss";

function getPercentage(denominator, numerator) {
  if (denominator === 0 || numerator === 0) {
    return 0;
  }
  const trunc = Math.trunc(denominator / numerator);
  if (Number.isNaN(trunc)) {
    return 0;
  }
  return trunc;
}

export default function ControllerChart({ chartData, totalLabel }) {
  const totalCount =
    (chartData.blocked || 0) +
    (chartData.alert || 0) +
    (chartData.running || 0);

  return (
    <div className="p-chart">
      <div className="p-chart__chart">
        <DonutChart chartData={chartData} />
      </div>
      <div className="p-chart__legend">
        <ul className="p-list p-legend">
          <li
            className="p-list__item p-legend__item label"
            data-testid="legend-label"
          >
            <strong data-testid="total-count">
              {totalCount} {pluralize(totalCount, totalLabel)}
            </strong>
          </li>
          <li
            className="p-list__item p-legend__item is-blocked"
            data-testid="legend-blocked"
          >
            Blocked: {getPercentage(totalCount, chartData.blocked)}%,{" "}
            {chartData.blocked || 0}
          </li>
          <li
            className="p-list__item p-legend__item is-alert"
            data-testid="legend-alert"
          >
            Alerts: {getPercentage(totalCount, chartData.alert)}%,{" "}
            {chartData.alert || 0}
          </li>
          <li
            className="p-list__item p-legend__item is-running"
            data-testid="legend-running"
          >
            Running: {getPercentage(totalCount, chartData.running)}%,{" "}
            {chartData.running || 0}
          </li>
        </ul>
      </div>
    </div>
  );
}
