import { useCallback, useState } from "react";

export type FilterState = {
  severity: string;
  serviceId: string;
};

export default function UseUrlHooks() {
  const [filters, setFilters] = useState<FilterState>(() => {
    const params = new URLSearchParams(window.location.search);
    return ({
      severity: params.get('severity') || 'all',
      serviceId: params.get('serviceId') || 'all',
    })
  });

  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      const params = new URLSearchParams(window.location.search);

      if (value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      const queryString = params.toString();
      const nextUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
      window.history.replaceState(null, '', nextUrl);

      return next;
    })
  }, [])

  return ({ filters, updateFilter });
};