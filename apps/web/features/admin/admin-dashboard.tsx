'use client';
import { useEffect, useState } from 'react';
import type { DashboardInsights, DashboardQuery } from '@brasa-viva/contracts';
import { AdminApiError, getDashboardInsights } from '../../lib/admin-api';
import { canManageCatalog, useAdminSession } from './admin-shell';
import { DashboardView } from './dashboard-view';

export function AdminDashboard() {
  const session = useAdminSession();
  const [days, setDays] = useState<DashboardQuery['days']>(30);
  const [branchId, setBranchId] = useState('');
  const [data, setData] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);
    getDashboardInsights({ days, ...(branchId ? { branchId } : {}) })
      .then((result) => {
        if (current) setData(result);
      })
      .catch((reason: unknown) => {
        if (current)
          setError(
            reason instanceof AdminApiError
              ? reason.message
              : 'No fue posible cargar los indicadores. Intenta nuevamente.'
          );
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [days, branchId, retry]);
  return (
    <DashboardView
      fullName={session.fullName}
      days={days}
      branchId={branchId}
      data={data}
      loading={loading}
      error={error}
      setDays={setDays}
      setBranchId={setBranchId}
      onRefresh={() => setRetry((value) => value + 1)}
      canEditCatalog={canManageCatalog(session)}
    />
  );
}
