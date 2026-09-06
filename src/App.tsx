import MetricsTable from "./components/MetricsTable";
import useTelemetryStream from "./workers/useTelemetryStream"

export default function App() {
  const {
    metrics, packets,
    startStream, stopStream, clearMetrics
  } = useTelemetryStream();

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Telemetry Stream Pipeline</h1>

      <div>
        <button onClick={() => startStream(10)}>Start at 10Hz</button>
        <button onClick={() => startStream(500)}>Start at 500Hz</button>
        <button onClick={() => stopStream()}>Stop</button>
        <button onClick={() => clearMetrics()}>Reset</button>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <p>Valid Packets: {metrics.validCount}</p>
        <p>Corrupted Packets: {metrics.corruptedCount}</p>
        <p>Dropped Packets: {metrics.droppedCount}</p>
      </div>

      <MetricsTable packets={packets} />
    </main>
  )
}