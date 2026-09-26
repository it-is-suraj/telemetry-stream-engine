import { type FilterState } from "../workers/useUrlHooks";

type FilterToolbarProps = {
  filters: FilterState;
  updateFilterToUrl: (key: keyof FilterState, value: string) => void;
  startStream: (rateHz: number) => void;
  stopStream: () => void;
}

export default function FilterToolbar(props: FilterToolbarProps) {
  const { filters, updateFilterToUrl, startStream, stopStream } = props;

  return (
    <div className="engine-actionBar">
      <div className="telemetry--actions">
        <button onClick={() => startStream(10)}>Start at 10Hz</button>
        <button onClick={() => startStream(500)}>Start at 500Hz</button>
        <button onClick={() => stopStream()}>Stop</button>
      </div>

      <div className="telemetry--filters">
        <div>
          <label><strong>Severity: </strong></label>
          <select
            value={filters.severity}
            onChange={(e) => updateFilterToUrl('severity', e.target.value)}
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label><strong>Service: </strong></label>
          <select
            value={filters.serviceId}
            onChange={(e) => updateFilterToUrl('serviceId', e.target.value)}
          >
            <option value="all">All Services</option>
            <option value="srv-0">srv-0</option>
            <option value="srv-1">srv-1</option>
            <option value="srv-2">srv-2</option>
            <option value="srv-3">srv-3</option>
            <option value="srv-4">srv-4</option>
          </select>
        </div>
      </div>
    </div>
  );
};