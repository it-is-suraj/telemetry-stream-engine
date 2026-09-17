import { useCallback, useEffect, useRef, useState } from "react";
import { TelemetryStreamPackage, type TelemetryPacket } from "../types/telemetryStream.type";

type MetricsDto = {
  validCount: number;
  corruptedCount: number;
  outOfOrderCount: number;
};

const getInitialMetricsData = (): MetricsDto => ({ validCount: 0, corruptedCount: 0, outOfOrderCount: 0 });

export default function useTelemetryStream() {

  const workerRef = useRef<Worker | null>(null);

  const metricsRef = useRef<MetricsDto>(getInitialMetricsData());
  const packetsRef = useRef<TelemetryPacket[]>([]);

  const lastMaxTimestampRef = useRef<number>(0);

  const [metrics, setMetrics] = useState(getInitialMetricsData());
  const [packets, setPackets] = useState<TelemetryPacket[]>([]);

  useEffect(() => {
    const worker = new Worker(
      new URL('./telemetry.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const result = TelemetryStreamPackage.safeParse(e.data);

      if (result.success) {
        metricsRef.current.validCount++;
        const packet = result.data;

        if (packet.timestamp < lastMaxTimestampRef.current) {
          metricsRef.current.outOfOrderCount++;
        } else {
          lastMaxTimestampRef.current = packet.timestamp;
        }

        packetsRef.current.push(packet);
      } else {
        metricsRef.current.corruptedCount++;
      }
    }

    let animationFrameId: number;

    const flushLoop = () => {
      if (packetsRef.current.length > 0) {
        const newBatch = packetsRef.current;
        packetsRef.current = [];

        const reversedNewBatch = newBatch.slice().reverse();
        setPackets(prev => ([...reversedNewBatch, ...prev].slice(0, 1000)));

        setMetrics({
          validCount: metricsRef.current.validCount,
          corruptedCount: metricsRef.current.corruptedCount,
          outOfOrderCount: metricsRef.current.outOfOrderCount,
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
    metricsRef.current = getInitialMetricsData();
    packetsRef.current = [];
    lastMaxTimestampRef.current = 0;
    setMetrics(getInitialMetricsData());
    setPackets([]);
  }, [])

  return ({ metrics, packets, startStream, stopStream, clearMetrics })
}