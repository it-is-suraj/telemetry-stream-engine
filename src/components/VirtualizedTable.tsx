import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState, useLayoutEffect } from "react";
import type { TelemetryPacket } from "../types/telemetryStream.type";

type VirtualizedTableProps = {
  packets: TelemetryPacket[];
  lastBatchSizeAdded: number;
};

const ROW_HEIGHT = 36;
const MAX_PACKETS = 1000;

export default function VirtualizedTable({ packets, lastBatchSizeAdded }: VirtualizedTableProps) {

  const parentRef = useRef<HTMLDivElement | null>(null);
  const [isAutoScrollLocked, setIsAutoScrollLocked] = useState(true);

  const rowVirtualizer = useVirtualizer({
    count: packets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  const handleScroll = () => {
    if (!parentRef.current) return;
    const isAtTop = parentRef.current.scrollTop < 15;
    setIsAutoScrollLocked(isAtTop);
  };

  const handleSetLive = () => {
    if (parentRef.current) parentRef.current.scrollTop = 0;
    setIsAutoScrollLocked(true);
  }

  useLayoutEffect(() => {
    if (!parentRef.current) return;

    if (isAutoScrollLocked) {
      parentRef.current.scrollTop = 0;
    } else if (lastBatchSizeAdded > 0 && parentRef.current.scrollTop > 0) {
      const maxScrollTop = (MAX_PACKETS - 1) * ROW_HEIGHT;
      const targetScroll = parentRef.current.scrollTop + lastBatchSizeAdded * ROW_HEIGHT;

      parentRef.current.scrollTop = Math.min(targetScroll, maxScrollTop);
    }
  }, [packets, isAutoScrollLocked, lastBatchSizeAdded]);

  return (<>
    <div className="live--section">
      {packets.length > 0 && <span className={`live-status ${isAutoScrollLocked ? "live" : ""}`}>
        {isAutoScrollLocked ? '🟢 LIVE STREAM (AUTO-SCROLL)' : '🟡 PAUSED ON SCROLL'}
      </span>}
      {!isAutoScrollLocked && <button onClick={handleSetLive}>View Live</button>}
    </div>

    <div ref={parentRef} className="virtualized--container" onScroll={handleScroll}>
      <div className="virtualized--header">
        <span className="row-cell">Timestamp</span>
        <span className="row-cell">Service</span>
        <span className="row-cell">Severity</span>
        <span className="row-cell">Latency</span>
      </div>

      <div className="virtualizer--table" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const packet = packets[virtualRow.index];
          if (!packet) return null;

          return (
            <div key={packet.id} className="virtualizer--row"
              style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
            >
              <span className="row-cell">{packet.timestamp}</span>
              <span className="row-cell">{packet.serviceId}</span>
              <span className="row-cell">{packet.severity}</span>
              <span className="row-cell">{packet.latencyMs}ms</span>
            </div>
          );
        })}
      </div>
    </div>
  </>);
}
