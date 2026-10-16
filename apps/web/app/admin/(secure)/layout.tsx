import '../../../features/admin/executive.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { AdminShell } from '../../../features/admin/admin-shell';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function SecureAdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
