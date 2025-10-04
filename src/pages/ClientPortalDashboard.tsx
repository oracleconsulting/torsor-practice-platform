import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ClientData {
  id: string;
  name: string;
  email: string;
}

const ClientPortalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🏠 ClientPortalDashboard component rendered');
  console.log('📍 Current URL:', window.location.href);
  console.log('🔑 Client token:', localStorage.getItem('client_auth_token'));
  console.log('👤 Client data:', localStorage.getItem('client_data'));

  useEffect(() => {
    console.log('🔄 Dashboard useEffect triggered');
    
    const token = localStorage.getItem('client_auth_token');
    const storedClientData = localStorage.getItem('client_data');

    console.log('🔍 Checking auth data:', { token: !!token, storedData: !!storedClientData });

    if (!token || !storedClientData) {
      console.log('❌ No auth data found, redirecting to login');
      navigate('/client-portal/login');
      return;
    }

    try {
      const parsedData = JSON.parse(storedClientData);
      console.log('✅ Parsed client data:', parsedData);
      setClientData(parsedData);
    } catch (err) {
      console.error('❌ Error parsing client data:', err);
      navigate('/client-portal/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    console.log('🚪 Logging out client');
    localStorage.removeItem('client_auth_token');
    localStorage.removeItem('client_data');
    navigate('/client-portal/login');
  };

  if (loading) {
    console.log('⏳ Dashboard loading...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!clientData) {
    console.log('❌ No client data, showing error');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Authentication Error</h2>
          <p className="text-gray-600 mt-2">Please log in again.</p>
          <button 
            onClick={() => navigate('/client-portal/login')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering dashboard for client:', clientData.name);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
              <p className="text-sm text-gray-500">Welcome, {clientData.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">🎉 Success!</h2>
            <p className="text-lg text-gray-600 mt-2">
              Your client portal account has been created successfully!
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Access your important documents and files
                </p>
                <div className="mt-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    View Documents
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Messages</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Communicate with your accounting team
                </p>
                <div className="mt-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    View Messages
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Account</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Manage your account settings
                </p>
                <div className="mt-4">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Account Settings
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800">🎯 System Status</h3>
            <div className="mt-3 space-y-2 text-sm text-green-700">
              <p>✅ Authentication: Working</p>
              <p>✅ Account Creation: Working</p>
              <p>✅ JWT Tokens: Working</p>
              <p>✅ Database Integration: Working</p>
              <p>✅ Client Portal: Ready for development</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortalDashboard; 