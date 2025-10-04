import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ClientPortal from '../pages/ClientPortal';
import ClientPortalDashboard from '../pages/ClientPortalDashboard';

export const ClientPortalRoutes = () => {
  return (
    <Routes>
      <Route path=":clientId/dashboard" element={<ClientPortalDashboard />} />
      <Route path="" element={<Navigate to=":clientId/dashboard" replace />} />
      <Route path="*" element={<Navigate to=":clientId/dashboard" replace />} />
    </Routes>
  );
};

export default ClientPortalRoutes; 