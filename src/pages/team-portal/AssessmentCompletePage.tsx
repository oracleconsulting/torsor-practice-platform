import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AssessmentCompletePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-500" />
          </div>
          <CardTitle className="text-3xl text-gray-900 dark:text-white font-bold">Assessment Complete!</CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-400 mt-4">
            Thank you for completing your skills assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 text-gray-700 dark:text-gray-300">
          <p className="text-base">
            Your responses have been recorded and your team lead will review them shortly.
          </p>
          <p className="text-base">
            You'll receive an email within the next week with instructions on how to access your full team portal,
            where you can:
          </p>
          <ul className="text-left max-w-md mx-auto space-y-3 mt-6">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>View your skill profile and development areas</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>Track your professional development goals</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span>Access team resources and training materials</span>
            </li>
          </ul>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            You can close this window now.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

