import { useCallback, useEffect, useRef, useState } from "react";
import { TelemetryStreamPackage, type TelemetryPacket } from "../types/telemetryStream.type";
import { insertSortedDesc } from "./insertedSorted";

type MetricsDto = {
  validCount: number;
  corruptedCount: number;
  bufferedCount: number;
  droppedCount: number;
};

export type FilterCriteria = {
  severity?: string;
  serviceId?: string;
}

const JITTER_BUFFER_MS = 3000;

const getInitialMetricsData = (): MetricsDto => ({ validCount: 0, corruptedCount: 0, bufferedCount: 0, droppedCount: 0 });

export default function useTelemetryStream() {

  const workerRef = useRef<Worker | null>(null);
  const stagingBufferRef = useRef<TelemetryPacket[]>([]);
  const highWatermarkRef = useRef<number>(0);
  const isStreamPausedRef = useRef<boolean>(false);
  const streamFiltersRef = useRef<FilterCriteria>({ severity: 'all', serviceId: 'all' });

  const [metrics, setMetrics] = useState(getInitialMetricsData());
  const [packets, setPackets] = useState<TelemetryPacket[]>([]);

  const instanceId = useRef<number | null>(null);

  useEffect(() => {
    const instId = Math.floor(Math.random() * 1000);
    instanceId.current = instId;
  }, []);

  const matchesFilter = (packet: TelemetryPacket, filter: FilterCriteria) => {
    const matchesSeverity = !filter.severity || filter.severity === 'all' || packet.severity === filter.severity;
    const matchesService = !filter.serviceId || filter.serviceId === 'all' || packet.serviceId === filter.serviceId;
    return matchesSeverity && matchesService;
  };

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
        if (!matchesFilter(packet, streamFiltersRef.current)) return;

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

          if (packet.timestamp >= highWatermarkRef.current && matchesFilter(packet, streamFiltersRef.current)) {
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

        if (!isStreamPausedRef.current) {
          setPackets((prev) => ([...releaseBatchAsc.toReversed(), ...prev].slice(0, 1000)));
        }
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
  }, []);

  const playStream = () => {
    isStreamPausedRef.current = false;
  }

  const pauseStream = () => {
    isStreamPausedRef.current = true;
  }

  const setStreamFilter = useCallback((filter: FilterCriteria) => {
    streamFiltersRef.current = filter;
    workerRef.current?.postMessage({ action: 'UPDATE_FILTER', filter });
    stagingBufferRef.current = stagingBufferRef.current.filter((packet) => matchesFilter(packet, filter));
    setPackets((prev) => prev.filter((packet) => matchesFilter(packet, filter)));
  }, [])

  return ({
    metrics, packets,
    startStream, stopStream, playStream, pauseStream, setStreamFilter
  })
}