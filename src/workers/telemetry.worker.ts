type FilterCriteria = {
  severity?: string;
  serviceId?: string;
}

let intervalId: number | null = null;
let currFilter: FilterCriteria = { severity: 'all', serviceId: 'all' }

self.onmessage = (e: MessageEvent<{ action: 'START' | 'STOP' | 'UPDATE_FILTER'; rateHz: number; filters?: FilterCriteria }>) => {
  const { action, rateHz, filters } = e.data;

  if (action === 'UPDATE_FILTER' && filters) {
    currFilter = { ...currFilter, ...filters };
    return;
  }

  if (action === 'STOP' && intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    return;
  }

  if (action === 'START') {
    if (intervalId) clearInterval(intervalId);
    const delay = 1000 / rateHz;

    intervalId = self.setInterval(() => {
      const isCorrupted = Math.random() < 0.05;
      const isOutOfOrder = Math.random() < 0.02;

      const timestamp = isOutOfOrder
        ? Date.now() - Math.floor(Math.random() * 5000 + 1000)
        : Date.now();

      const payload = isCorrupted
        ? { badField: "corrupted_data", timestamp: Date.now() }
        : {
          id: crypto.randomUUID(),
          timestamp,
          serviceId: `srv-${Math.floor(Math.random() * 5)}`,
          severity: ['info', 'warn', 'critical'][Math.floor(Math.random() * 3)],
          latencyMs: Number((Math.random() * 400).toFixed(2)),
        };

      if (currFilter.severity && currFilter.severity !== 'all' && payload.severity !== currFilter.severity) {
        return;
      }
      if (currFilter.serviceId && currFilter.serviceId !== 'all' && payload.serviceId !== currFilter.serviceId) {
        return;
      }

      self.postMessage(payload);
    }, delay);
  }
};