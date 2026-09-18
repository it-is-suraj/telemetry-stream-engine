import type { TelemetryPacket } from "../types/telemetryStream.type";

// Inserts packet into array sorted by timestamp DESCENDING (newest first)
export function insertSortedDesc(arr: TelemetryPacket[], packet: TelemetryPacket): void {
  let low = 0;
  let high = arr.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    // Descending order: higher timestamps come first
    if (arr[mid].timestamp > packet.timestamp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  arr.splice(low, 0, packet);
}