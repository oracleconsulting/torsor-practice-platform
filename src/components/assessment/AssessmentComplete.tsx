
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AssessmentComplete = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-oracle-cream w-screen">
      <div className="px-4 py-8 w-full">
        <Card className="bg-white/80 backdrop-blur border-oracle-navy/20 shadow-lg text-center max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl text-oracle-navy mb-4">
              Excellent! You're a Good Fit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-oracle-navy/80">
              Based on your responses, you're exactly the kind of founder we love working with. 
              You have clarity on your vision and understand the challenges you're facing.
            </p>
            
            <div className="bg-oracle-gold/10 p-6 rounded-lg">
              <h3 className="font-semibold text-oracle-navy mb-3">What's Next?</h3>
              <p className="text-oracle-navy/70 mb-4">
                Ready to dive deeper? Part 2 will help us understand your business model, 
                operations, and specific needs so we can create a personalized roadmap just for you.
              </p>
            </div>

            <Button
              onClick={() => navigate('/assessment/part2')}
              className="bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy font-semibold px-8 py-3 text-lg"
            >
              Continue to Part 2
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <p className="text-sm text-oracle-navy/60">
              This will take about 15-20 minutes to complete
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
