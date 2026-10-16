import type { Metadata } from 'next';
import { AdminDashboard } from '../../../features/admin/admin-dashboard';

export const metadata: Metadata = { title: 'Administración', robots: { index: false, follow: false } };

export default function AdminPage() {
  return <section className="admin-page"><p className="admin-eyebrow">OPERACIÓN</p><h1>Resumen</h1><AdminDashboard /></section>;
}
