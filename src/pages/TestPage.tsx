
export default function TestPage() {
  console.log('TestPage render at:', new Date().toISOString());
  console.log('TestPage URL:', window.location.href);
  
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center w-screen">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Static Test Page - No Auth</h1>
        <p className="mb-2">This page has NO auth, NO useEffect, NO navigation.</p>
        <p className="mb-4">If this refreshes, the problem is in App.tsx or higher.</p>
        <p className="text-sm text-gray-600">Render time: {new Date().toISOString()}</p>
        <p className="text-sm text-gray-600">URL: {window.location.href}</p>
      </div>
    </div>
  );
}
