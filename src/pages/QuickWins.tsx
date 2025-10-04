import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, ArrowLeft, Zap } from "lucide-react";

const QuickWins = () => {
  const navigate = useNavigate();
  
  const quickWins = [
    {
      id: 1,
      title: "Set up Google Analytics",
      description: "Track your website visitors and understand user behavior",
      timeEstimate: "15 minutes",
      impact: "High",
      category: "Analytics",
      completed: false
    },
    {
      id: 2,
      title: "Create social media profiles",
      description: "Establish your brand presence on LinkedIn and Twitter",
      timeEstimate: "30 minutes",
      impact: "Medium",
      category: "Marketing",
      completed: false
    },
    {
      id: 3,
      title: "Write your first blog post",
      description: "Share your expertise and start building thought leadership",
      timeEstimate: "45 minutes",
      impact: "High",
      category: "Content",
      completed: true
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Quick Wins
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            High-Impact Tasks You Can Complete Today
          </h2>
          <p className="text-gray-400 text-lg">
            Start building momentum with these quick, actionable tasks
          </p>
        </div>

        {/* Quick Wins Grid */}
        <div className="space-y-4">
          {quickWins.map((task) => (
            <Card key={task.id} className="bg-gray-900/80 backdrop-blur-sm border-gray-800 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                    {task.completed && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-gray-400 mb-4">{task.description}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-400">{task.timeEstimate}</span>
                    </div>
                    <Badge 
                      className={`${
                        task.impact === 'High' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}
                    >
                      {task.impact} Impact
                    </Badge>
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                      {task.category}
                    </Badge>
                  </div>
                </div>
                
                <div className="ml-6">
                  <Button
                    className={`${
                      task.completed 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                    }`}
                    disabled={task.completed}
                  >
                    {task.completed ? 'Completed' : 'Start Task'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border-purple-700/50 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready for More Challenges?
            </h3>
            <p className="text-gray-400 mb-6">
              Check out your full roadmap for comprehensive business transformation
            </p>
            <Button
              onClick={() => navigate('/roadmap/full')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              View Full Roadmap
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuickWins;
