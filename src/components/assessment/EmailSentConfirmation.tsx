
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface EmailSentConfirmationProps {
  email: string;
  onTryDifferentEmail: () => void;
}

export const EmailSentConfirmation = ({ email, onTryDifferentEmail }: EmailSentConfirmationProps) => {
  return (
    <div className="min-h-screen bg-oracle-cream w-screen">
      <div className="px-4 py-8 w-full">
        <Card className="bg-white/80 backdrop-blur border-oracle-navy/20 shadow-lg max-w-2xl mx-auto text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-oracle-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-oracle-navy" />
            </div>
            <CardTitle className="text-2xl text-oracle-navy">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-oracle-navy/70 mb-6">
              We've sent a secure link to <strong>{email}</strong>. Click the link to see your results and continue to Part 2.
            </p>
            <Button 
              variant="outline" 
              onClick={onTryDifferentEmail}
              className="border-oracle-navy text-oracle-navy hover:bg-oracle-navy hover:text-oracle-cream"
            >
              Try Different Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
