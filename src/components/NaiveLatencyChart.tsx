import type { TelemetryPacket } from '../types/telemetryStream.type';

type Props = {
  packets: TelemetryPacket[];
};

export default function NaiveLatencyChart({ packets }: Props) {
  const chartHeight = 120;
  const chartWidth = 800;
  const maxLatency = 400; // Expected max latency in ms

  return (
    <div className='naive-latency-chart'>
      <h3>Raw Latency Stream (Naive SVG - 1,000 DOM Nodes)</h3>
      <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
        {packets.map((packet, index) => {
          const barWidth = chartWidth / 1000;
          const barHeight = (packet.latencyMs / maxLatency) * chartHeight;
          const x = index * barWidth;
          const y = chartHeight - barHeight;

          const color =
            packet.severity === 'critical'
              ? '#f56565'
              : packet.severity === 'warn'
                ? '#ed8936'
                : '#4299e1';

          return (
            <rect
              key={packet.id}
              x={x}
              y={y}
              width={Math.max(barWidth - 0.5, 1)}
              height={barHeight}
              fill={color}
              opacity={0.8}
            />
          );
        })}
      </svg>
    </div>
  );
}