import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AssessmentCompletePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <Card className="max-w-2xl bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-white">Assessment Complete!</CardTitle>
          <CardDescription className="text-lg text-gray-400 mt-4">
            Thank you for completing your skills assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 text-gray-300">
          <p>
            Your responses have been recorded and your team lead will review them shortly.
          </p>
          <p>
            You'll receive an email within the next week with instructions on how to access your full team portal,
            where you can:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 mt-4">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>View your skill profile and development areas</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Track your professional development goals</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Access team resources and training materials</span>
            </li>
          </ul>
          <p className="text-sm text-gray-500 mt-6">
            You can close this window now.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

