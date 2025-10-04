
export default function AuthCallback() {
  console.log('AuthCallback mounted at:', new Date().toISOString());
  console.log('AuthCallback URL:', window.location.href);
  console.log('AuthCallback pathname:', window.location.pathname);
  
  return (
    <div className="min-h-screen bg-oracle-cream flex items-center justify-center w-screen">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Auth Callback Test Page</h1>
        <p className="mb-2">If you see this page staying still, the component works.</p>
        <p className="mb-4">Check console for logs.</p>
        <p className="text-sm text-gray-600">Current URL: {window.location.href}</p>
        <p className="text-sm text-gray-600">Time: {new Date().toISOString()}</p>
        <div className="mt-4">
          <a href="/" className="text-blue-500 hover:underline">Go to Homepage</a>
        </div>
      </div>
    </div>
  );
}
