import { Layout } from '@/components/Layout';

export default function AppointmentsPage() {
  return (
    <Layout
      title="Appointments"
      subtitle="Schedule and manage meetings with your advisor"
    >
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <p className="text-slate-600 mb-8">
          Appointment booking and management will be implemented here.
        </p>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Coming Soon:</strong> This page will integrate with Cal.com to let you
            book calls with your advisor and see upcoming appointments.
          </p>
        </div>
      </div>
    </Layout>
  );
}

