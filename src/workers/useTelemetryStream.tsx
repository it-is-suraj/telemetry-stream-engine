import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

export const TelemetryStreamPackage = z.object({
  id: z.uuid(),
  timestamp: z.number(),
  serviceId: z.string(),
  severity: z.enum(['info', 'warn', 'critical']),
  latencyMs: z.number().nonnegative(),
})

export type TelemetryPacket = z.infer<typeof TelemetryStreamPackage>;

export default function useTelemetryStream() {

  const workerRef = useRef<Worker | null>(null);

  const [metrics, setMetrics] = useState({
    validCount: 0,
    corruptedCount: 0,
    droppedCount: 0
  })

  const [packets, setPackets] = useState<TelemetryPacket[]>([]);

  useEffect(() => {
    const worker = new Worker(
      new URL('./telemetry.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const t0 = performance.now();
      const result = TelemetryStreamPackage.safeParse(e.data);
      const parseTime = performance.now() - t0;

      if (parseTime > 1) {
        console.warn(`Zod parse took ${parseTime.toFixed(3)}ms for a single packet!`);
      }

      setMetrics((prev) => {
        if (result.success) {
          return ({ ...prev, validCount: prev.validCount + 1 })
        } else {
          return ({ ...prev, corruptedCount: prev.corruptedCount + 1 })
        }
      })

      setPackets((prev) => {
        if (result.success) {
          return [result.data, ...prev].slice(0, 1000)
        } else {
          return prev
        }
      });
    }

    return () => {
      worker.terminate();
      workerRef.current = null;
    }
  }, [])

  const startStream = useCallback((rateHz: number) => {
    workerRef.current?.postMessage({ action: 'START', rateHz });
  }, []);

  const stopStream = useCallback(() => {
    workerRef.current?.postMessage({ action: 'STOP' });
  }, [])

  const clearMetrics = useCallback(() => {
    setMetrics({
      validCount: 0,
      corruptedCount: 0,
      droppedCount: 0
    })
    setPackets([])
  }, [])

  return ({ metrics, packets, startStream, stopStream, clearMetrics })
}