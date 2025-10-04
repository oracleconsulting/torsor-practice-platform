import { DashboardLayout } from '@/components/dashboard/core/Layout';
import { CommandCenter } from '@/components/dashboard/CommandCenter';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <CommandCenter />
    </DashboardLayout>
  );
}