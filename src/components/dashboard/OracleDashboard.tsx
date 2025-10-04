import React from 'react';
import { useOracleData } from '@/hooks/useOracleData';
import { EnhancedBoardDisplay } from './EnhancedBoardDisplay';
// Import other widgets as needed (e.g., RoadmapDisplay, BoardMetrics, etc.)

const OracleDashboard = () => {
  const { data, loading, error } = useOracleData();

  if (loading) return <div>Loading Oracle Dashboard...</div>;
  if (error) return <div>Error loading dashboard: {error}</div>;
  if (!data) return <div>No data available.</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16 }}>
        {data.businessName || 'Business'} Dashboard
      </h1>
      <div style={{ marginBottom: 16 }}>
        <strong>Revenue:</strong> £{data.currentRevenue?.toLocaleString() || 'N/A'}
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Board:</strong> {Array.isArray(data.board) && data.board.length > 0 ? data.board.join(', ') : 'N/A'}
      </div>
      {/* Enhanced Board Display */}
      <div style={{ marginBottom: 32 }}>
        <EnhancedBoardDisplay 
          groupId={data.groupId}
          boardData={data.board}
          rationale={data.boardRationale}
        />
      </div>
      {/* Placeholders for other widgets: roadmap, metrics, etc. */}
      {/* <RoadmapDisplay roadmap={data.roadmap} /> */}
      {/* <BoardMetrics groupId={data.groupId} /> */}
    </div>
  );
};

export default OracleDashboard;