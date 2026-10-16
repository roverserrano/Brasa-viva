import type { Metadata } from 'next';
import { AdminDashboard } from '../../../features/admin/admin-dashboard';

export const metadata: Metadata = { title: 'Administración', robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <section className="admin-page">
      <AdminDashboard />
    </section>
  );
}
