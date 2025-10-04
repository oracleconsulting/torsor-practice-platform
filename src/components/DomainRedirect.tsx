
import { useEffect } from 'react';

export const DomainRedirect = () => {
  useEffect(() => {
    const currentHost = window.location.hostname;
    const isLovablePreview = currentHost === 'oracle-method-portal.lovable.app';
    
    if (isLovablePreview) {
      // Preserve the current path and query parameters
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      const currentHash = window.location.hash;
      
      // Construct the new URL with the custom domain
      const newUrl = `https://oracleconsulting.ai${currentPath}${currentSearch}${currentHash}`;
      
      console.log('Redirecting from Lovable preview to custom domain:', newUrl);
      
      // Perform the redirect
      window.location.replace(newUrl);
    }
  }, []);

  // This component doesn't render anything
  return null;
};
