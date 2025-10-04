
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calculator, Heart, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SpecialistPortals: React.FC = () => {
  const navigate = useNavigate();

  const portals = [
    {
      title: "Accountancy Portal",
      description: "Transform your practice with AI-powered advisory tools",
      icon: Calculator,
      color: "bg-blue-500",
      path: "/portal/accountancy"
    },
    {
      title: "Healthcare Portal",
      description: "Digital health solutions and practice management",
      icon: Heart,
      color: "bg-green-500",
      path: "/portal/healthcare"
    },
    {
      title: "Corporate Portal",
      description: "Enterprise transformation and strategic advisory",
      icon: Building,
      color: "bg-purple-500",
      path: "/portal/corporate"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {portals.map((portal) => (
        <Card key={portal.title} className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${portal.color}`}>
                <portal.icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-oracle-navy">{portal.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{portal.description}</p>
            <Button 
              variant="outline" 
              className="w-full border-oracle-navy text-oracle-navy hover:bg-oracle-navy hover:text-white"
              onClick={() => navigate(portal.path)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Access Portal
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
