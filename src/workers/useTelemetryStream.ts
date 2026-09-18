import { useCallback, useEffect, useRef, useState } from "react";
import { TelemetryStreamPackage, type TelemetryPacket } from "../types/telemetryStream.type";
import { insertSortedDesc } from "./insertedSorted";

type MetricsDto = {
  validCount: number;
  corruptedCount: number;
  bufferedCount: number;
};

const JITTER_BUFFER_MS = 3000; // Hold packets for 3s to let late arrivals slot in

const getInitialMetricsData = (): MetricsDto => ({ validCount: 0, corruptedCount: 0, bufferedCount: 0 });

export default function useTelemetryStream() {

  const workerRef = useRef<Worker | null>(null);

  const stagingBufferRef = useRef<TelemetryPacket[]>([]);

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

    worker.onmessage = (e: MessageEvent) => {
      const result = TelemetryStreamPackage.safeParse(e.data);

      if (result.success) {
        validCount++;
        insertSortedDesc(stagingBufferRef.current, result.data);
      } else {
        corruptedCount++;
      }
    }

    let animationFrameId: number;

    const flushLoop = () => {
      const now = Date.now();
      const buffer = stagingBufferRef.current;

      const releaseBatch: TelemetryPacket[] = [];

      while (buffer.length > 0) {
        const oldestPacket = buffer[buffer.length - 1];
        if (now - oldestPacket.timestamp >= JITTER_BUFFER_MS) {
          releaseBatch.push(buffer.pop()!);
        } else {
          break;
        }
      }

      if (releaseBatch.length > 0) {
        setPackets((prev) => {
          const reversedReleaseBatch = releaseBatch.slice().reverse();
          return [...reversedReleaseBatch, ...prev].slice(0, 1000);
        });

        setMetrics({
          validCount,
          corruptedCount,
          bufferedCount: buffer.length,
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