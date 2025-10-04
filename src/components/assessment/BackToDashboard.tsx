import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const BackToDashboard = () => {
  const navigate = useNavigate();
  
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  return (
    <Button
      onClick={handleBackToDashboard}
      className="flex items-center gap-2"
      variant="outline"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Dashboard
    </Button>
  );
}; 