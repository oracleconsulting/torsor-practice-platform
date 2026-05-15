import { Navigate } from 'react-router-dom';

/**
 * Classic/PDF view is intentionally disabled while it is being rebuilt for full
 * dashboard parity. Keep the URL as a safe legacy redirect so old bookmarks do
 * not expose incomplete report content.
 */
export default function BenchmarkingReportClassicPage() {
  return <Navigate to="/service/benchmarking/report" replace />;
}
