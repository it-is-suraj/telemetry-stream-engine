let intervalId: number | null = null;

self.onmessage = (e: MessageEvent<{ action: 'START' | 'STOP'; rateHz: number }>) => {
  const { action, rateHz } = e.data;

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

      self.postMessage(payload);
    }, delay);
  }
};