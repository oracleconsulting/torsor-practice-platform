import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Video, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function KnowledgeHubPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Knowledge Hub</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <h3 className="text-lg font-semibold">Getting Started</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Essential guides to help you understand the Oracle Method and get the most from your transformation journey.
          </p>
          <Button variant="outline" className="w-full">
            View Guides
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h3 className="text-lg font-semibold">Templates & Tools</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Downloadable templates, checklists, and tools to support your business transformation.
          </p>
          <Button variant="outline" className="w-full">
            Browse Tools
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <Video className="h-8 w-8 text-green-600" />
            <h3 className="text-lg font-semibold">Video Library</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Expert-led video content covering key concepts, strategies, and implementation tips.
          </p>
          <Button variant="outline" className="w-full">
            Watch Videos
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-orange-600" />
            <h3 className="text-lg font-semibold">Community</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Connect with other business owners on similar transformation journeys.
          </p>
          <Button variant="outline" className="w-full">
            Join Community
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-red-600" />
            <h3 className="text-lg font-semibold">Case Studies</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Real-world examples of businesses that have successfully implemented the Oracle Method.
          </p>
          <Button variant="outline" className="w-full">
            Read Stories
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-indigo-600" />
            <h3 className="text-lg font-semibold">FAQ</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Frequently asked questions and answers about the Oracle Method and your transformation journey.
          </p>
          <Button variant="outline" className="w-full">
            View FAQ
          </Button>
        </Card>
      </div>
    </div>
  );
} 