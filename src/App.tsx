import { useEffect } from "react";
import FilterToolbar from "./components/FilterToolbar.tsx";
import VirtualizedTable from "./components/VirtualizedTable.tsx";
import useTelemetryStream from "./workers/useTelemetryStream.ts"
import UseUrlHooks from "./workers/useUrlHooks.ts";

export default function App() {
  const { filters, updateFilter } = UseUrlHooks();
  const {
    metrics, packets,
    startStream, stopStream, playStream, pauseStream, setStreamFilter
  } = useTelemetryStream();

  useEffect(() => {
    setStreamFilter(filters)
  }, [filters, setStreamFilter])

  return (
    <main className="telemetry--container">
      <h1>Telemetry Stream Pipeline</h1>

      <FilterToolbar
        filters={filters}
        updateFilterToUrl={updateFilter}
        startStream={startStream}
        stopStream={stopStream}
      />

      <div className="telemetry--counts">
        <p>Valid Packets: {metrics.validCount}</p>
        <p>Corrupted Packets: {metrics.corruptedCount}</p>
        <p>Dropped Packets: {metrics.droppedCount}</p>
        <p>Buffered Packets: {metrics.bufferedCount}</p>
      </div>

      <VirtualizedTable packets={packets} playStream={playStream} pauseStream={pauseStream} />
    </main>
  )
}