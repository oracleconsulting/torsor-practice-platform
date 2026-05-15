import { Navigate } from 'react-router-dom';

/**
 * Legacy URL: `/service/benchmarking/report/preview` used to host the dashboard while
 * the main route was the classic scroll report. Routes are swapped — send bookmarks here
 * to the canonical interactive report.
 */
export default function BenchmarkingReportPreviewPage() {
  return <Navigate to="/service/benchmarking/report" replace />;
}
