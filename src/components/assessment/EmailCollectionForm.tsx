
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmailCollectionFormProps {
  onEmailSent: () => void;
  onEmailChange: (email: string) => void;
  email: string;
}

export const EmailCollectionForm = ({ onEmailSent, onEmailChange, email }: EmailCollectionFormProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('=== EmailCollectionForm Debug ===');
    console.log('Redirecting to /auth - no API calls should be made from here');
    console.log('Current email prop:', email);
    console.log('=====================================');
    
    // Redirect to the dedicated auth page since we now use email/password authentication
    navigate('/auth');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-oracle-cream w-screen">
      <div className="px-4 py-8 w-full">
        <Card className="bg-white/80 backdrop-blur border-oracle-navy/20 shadow-lg max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-oracle-navy mb-4">
              Redirecting to Sign In...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-oracle-navy/80">
              Please wait while we redirect you to the authentication page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
