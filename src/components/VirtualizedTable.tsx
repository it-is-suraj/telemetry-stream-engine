import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useRef, useState } from "react";
import type { TelemetryPacket } from "../types/telemetryStream.type";

type VirtualizedTableProps = {
  packets: TelemetryPacket[];
  playStream: () => void;
  pauseStream: () => void;
};

export default function VirtualizedTable({ packets, playStream, pauseStream }: VirtualizedTableProps) {

  const parentRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const rowVirtualizer = useVirtualizer({
    count: packets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const isAtTop = parentRef.current.scrollTop < 15;

    if (isAtTop && isPaused) {
      setIsPaused(false);
      playStream();
    } else if (!isAtTop && !isPaused) {
      setIsPaused(true);
      pauseStream();
    }
  }, [isPaused, pauseStream, playStream]);

  const handleSetLive = () => {
    if (parentRef.current) parentRef.current.scrollTop = 0;
    setIsPaused(false);
    playStream();
  }

  return (<>
    <div className="live--section">
      {packets.length > 0 && <span className={`live-status ${!isPaused ? "live" : ""}`}>
        {!isPaused ? '🟢 LIVE STREAM (AUTO-SCROLL)' : '🟡 PAUSED ON SCROLL'}
      </span>}
      {isPaused && <button onClick={handleSetLive}>View Live</button>}
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
