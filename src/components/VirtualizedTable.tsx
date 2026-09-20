import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { TelemetryPacket } from "../types/telemetryStream.type";

type VirtualizedTableProps = {
  packets: TelemetryPacket[];
};

export default function VirtualizedTable({ packets }: VirtualizedTableProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: packets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="virtualized--container">
      <div className="virtualized--header">
        <span className="row-cell">Timestamp</span>
        <span className="row-cell">Delta vs Prev (ms)</span>
        <span className="row-cell">Service</span>
        <span className="row-cell">Severity</span>
        <span className="row-cell">Latency</span>
      </div>

      <div className="virtualizer--table" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const packet = packets[virtualRow.index];
          const nextPacket = packets[virtualRow.index + 1];
          const delta = nextPacket ? packet.timestamp - nextPacket.timestamp : 0;

          return (
            <div
              key={packet.id}
              className="virtualizer--row"
              style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
            >
              <span className="row-cell">{packet.timestamp}</span>
              <span className="row-cell">+{delta}ms</span>
              <span className="row-cell">{packet.serviceId}</span>
              <span className="row-cell">{packet.severity}</span>
              <span className="row-cell">{packet.latencyMs}ms</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
