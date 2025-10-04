
import { useAuth } from '@/contexts/AuthContext';

export default function TestAuth() {
  const { user, loading } = useAuth();
  
  console.log('TestAuth render:', { user: !!user, loading, userEmail: user?.email });
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Auth Page</h1>
      <div className="space-y-2">
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>User: {user ? user.email : 'Not logged in'}</p>
        <p>User ID: {user ? user.id : 'N/A'}</p>
        <p>Renders: Check console for logs</p>
        <p>Current URL: {window.location.href}</p>
        <p>Time: {new Date().toISOString()}</p>
      </div>
    </div>
  );
}
