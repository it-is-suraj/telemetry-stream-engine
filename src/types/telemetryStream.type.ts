import { z } from "zod";

export const TelemetryStreamPackage = z.object({
  id: z.uuid(),
  timestamp: z.number(),
  serviceId: z.string(),
  severity: z.enum(['info', 'warn', 'critical']),
  latencyMs: z.number().nonnegative(),
});
export type TelemetryPacket = z.infer<typeof TelemetryStreamPackage>;
