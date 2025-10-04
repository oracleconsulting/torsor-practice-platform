
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ClientPortalRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to assessment immediately
    navigate('/assessment', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-oracle-cream flex items-center justify-center">
      <div className="text-oracle-navy">Redirecting to assessment...</div>
    </div>
  );
};

export default ClientPortalRedirect;
