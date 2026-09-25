import type { TelemetryPacket } from "../types/telemetryStream.type";

interface PinnedPacketProps {
  packet: TelemetryPacket;
  handleClose: () => void;
}

export default function PinnedPacket({ packet, handleClose }: PinnedPacketProps) {
  return (
    <aside className="pinned-packet--card">
      <div>
        <div className="pinned-packet--card-header">
          <h3>Payload Detail</h3>
          <button onClick={handleClose}>X</button>
        </div>
        <hr style={{ margin: '0.75rem 0' }} />
        <div>
          <p><strong>ID:</strong>{packet.id}</p>
          <p><strong>Timestamp:</strong>{packet.timestamp}</p>
          <p><strong>Service:</strong>{packet.serviceId}</p>
          <p><strong>Severity:</strong>{packet.severity}</p>
          <p><strong>Latency:</strong>{packet.latencyMs}ms</p>
        </div>
      </div>

      <div>
        <small className="pinned-packet--note">
          Stream is paused while inspecting. Click "Resume Live" to jump back to top.
        </small>
      </div>
    </aside>
  );
};