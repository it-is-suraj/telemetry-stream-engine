import { useCallback, useEffect, useRef, useState } from "react";
import { TelemetryStreamPackage, type TelemetryPacket } from "../types/telemetryStream.type";
import { insertSortedDesc } from "./insertedSorted";

type MetricsDto = {
  validCount: number;
  corruptedCount: number;
  bufferedCount: number;
  droppedCount: number;
};

const JITTER_BUFFER_MS = 3000; // Hold packets for 3s to let late arrivals slot in

const getInitialMetricsData = (): MetricsDto => ({ validCount: 0, corruptedCount: 0, bufferedCount: 0, droppedCount: 0 });

export default function useTelemetryStream() {

  const workerRef = useRef<Worker | null>(null);
  const stagingBufferRef = useRef<TelemetryPacket[]>([]);
  const highWatermarkRef = useRef<number>(0);

  const [metrics, setMetrics] = useState(getInitialMetricsData());
  const [packets, setPackets] = useState<TelemetryPacket[]>([]);

  useEffect(() => {
    const worker = new Worker(
      new URL('./telemetry.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    let validCount = 0;
    let corruptedCount = 0;
    let droppedCount = 0;

    worker.onmessage = (e: MessageEvent) => {
      const result = TelemetryStreamPackage.safeParse(e.data);

      if (result.success) {
        validCount++;
        const packet = result.data;
        if (packet.timestamp < highWatermarkRef.current) {
          droppedCount++;
        } else {
          insertSortedDesc(stagingBufferRef.current, result.data);
        }
      } else {
        corruptedCount++;
      }
    }

    let animationFrameId: number;

    const flushLoop = () => {
      const now = Date.now();
      const buffer = stagingBufferRef.current;
      const releaseBatchAsc: TelemetryPacket[] = [];

      while (buffer.length > 0) {
        const oldestPacket = buffer[buffer.length - 1];
        if (now - oldestPacket.timestamp >= JITTER_BUFFER_MS) {
          const packet = buffer.pop()!;

          if (packet.timestamp >= highWatermarkRef.current) {
            releaseBatchAsc.push(packet);
            highWatermarkRef.current = packet.timestamp;
          } else {
            droppedCount++;
          }
        } else {
          break;
        }
      }

      if (releaseBatchAsc.length > 0) {
        const newestReleasedPacket = releaseBatchAsc[releaseBatchAsc.length - 1];
        if (newestReleasedPacket.timestamp > highWatermarkRef.current) {
          highWatermarkRef.current = newestReleasedPacket.timestamp;
        }

        setPackets((prev) => ([...releaseBatchAsc.toReversed(), ...prev].slice(0, 1000)));
        setMetrics({
          validCount,
          corruptedCount,
          bufferedCount: buffer.length,
          droppedCount
        });
      }
      animationFrameId = requestAnimationFrame(flushLoop);
    }

    animationFrameId = requestAnimationFrame(flushLoop);

    return () => {
      worker.terminate();
      workerRef.current = null;
      cancelAnimationFrame(animationFrameId);
    }
  }, [])

  const startStream = useCallback((rateHz: number) => {
    workerRef.current?.postMessage({ action: 'START', rateHz });
  }, []);

  const stopStream = useCallback(() => {
    workerRef.current?.postMessage({ action: 'STOP' });
  }, [])

  const clearMetrics = useCallback(() => {
    stagingBufferRef.current = [];
    setMetrics(getInitialMetricsData());
    setPackets([]);
  }, [])

  return ({ metrics, packets, startStream, stopStream, clearMetrics })
}