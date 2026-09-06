import type { TelemetryPacket } from "../workers/useTelemetryStream";

export default function MetricsTable({ packets }: { packets: TelemetryPacket[] }) {
  return (
    <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th>Status</th>
          <th>Timestamp</th>
          <th>Delta vs Prev (ms)</th>
          <th>Service</th>
          <th>Severity</th>
          <th>Latency</th>
        </tr>
      </thead>

      <tbody>
        {packets.map((packet, idx) => {
          const nextPacket = packets[idx + 1];
          const isOutOfOrder = nextPacket ? packet.timestamp < nextPacket.timestamp : false;
          const delta = nextPacket ? packet.timestamp - nextPacket.timestamp : 0;

          return (
            <tr
              key={packet.id}
              style={{
                backgroundColor: isOutOfOrder ? '#ffcccc' : 'transparent',
                color: isOutOfOrder ? '#900' : 'inherit',
                fontWeight: isOutOfOrder ? 'bold' : 'normal',
              }}
            >
              <td>{isOutOfOrder ? '⚠️ JITTER' : 'OK'}</td>
              <td>{packet.timestamp}</td>
              <td>{delta > 0 ? `+${delta}` : delta}</td>
              <td>{packet.serviceId}</td>
              <td>{packet.severity}</td>
              <td>{packet.latencyMs}ms</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}