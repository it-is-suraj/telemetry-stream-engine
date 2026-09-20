import VirtualizedTable from "./components/VirtualizedTable.tsx";
import useTelemetryStream from "./workers/useTelemetryStream.ts"

export default function App() {

  const { metrics, packets, lastBatchSizeAdded, startStream, stopStream, clearMetrics } = useTelemetryStream();

  return (
    <main className="telemetry--container">
      <h1>Telemetry Stream Pipeline</h1>

      <div className="telemetry--actions">
        <button onClick={() => startStream(10)}>Start at 10Hz</button>
        <button onClick={() => startStream(500)}>Start at 500Hz</button>
        <button onClick={() => stopStream()}>Stop</button>
        <button onClick={() => clearMetrics()}>Reset</button>
      </div>

      <div className="telemetry--counts">
        <p>Valid Packets: {metrics.validCount}</p>
        <p>Corrupted Packets: {metrics.corruptedCount}</p>
        <p>Dropped Packets: {metrics.droppedCount}</p>
        <p>Buffered Packets: {metrics.bufferedCount}</p>
      </div>

      <VirtualizedTable packets={packets} lastBatchSizeAdded={lastBatchSizeAdded} />
    </main>
  )
}