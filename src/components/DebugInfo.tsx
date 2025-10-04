import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export function DebugInfo() {
  const { user, loading } = useAuth();
  const location = useLocation();

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs">
      <div>Path: {location.pathname}</div>
      <div>User: {user ? user.email : 'None'}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
    </div>
  );
} 