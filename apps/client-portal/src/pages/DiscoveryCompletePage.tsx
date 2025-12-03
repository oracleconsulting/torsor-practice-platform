// ============================================================================
// DISCOVERY COMPLETE PAGE
// ============================================================================
// Thank you screen shown after client completes discovery assessment
// ============================================================================

import { CheckCircle, Clock, FileText, Mail, ArrowRight } from 'lucide-react';

interface DiscoveryCompletePageProps {
  clientName?: string;
}

export function DiscoveryCompletePage({ clientName }: DiscoveryCompletePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* RPGCC Logo */}
        <div className="flex items-center justify-center gap-1 mb-8">
          <span className="text-3xl font-black tracking-tight text-white">RPGCC</span>
          <div className="flex gap-1 ml-1">
            <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
          </div>
        </div>

        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Discovery Complete!
          </h1>
          <p className="text-xl text-slate-300">
            Thank you{clientName ? `, ${clientName}` : ''}, for completing your discovery assessment.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            What Happens Next?
          </h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">We Review Your Responses</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Our team will carefully analyze your answers alongside any financial information we have on file.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Within 2-3 Business Days</h3>
                <p className="text-gray-600 text-sm mt-1">
                  We'll prepare a personalized report identifying opportunities and potential areas where we can add value to your business.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">We'll Be In Touch</h3>
                <p className="text-gray-600 text-sm mt-1">
                  You'll receive an email with your findings and an invitation to discuss the results with one of our team.
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-8" />

          {/* Expectation Setting */}
          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2">What to Expect in Your Report</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>Potential service lines that could benefit your business</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>Estimated ROI and value opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>Recommended next steps tailored to your goals</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>No obligation – just insights to help you make informed decisions</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Secondary Card - Contact */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/10">
          <p className="text-slate-300 text-sm">
            Questions in the meantime? Contact us at{' '}
            <a href="mailto:hello@rpgcc.co.uk" className="text-amber-400 hover:text-amber-300 font-medium">
              hello@rpgcc.co.uk
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm space-y-2">
          <p>You can safely close this window. We'll email you when your report is ready.</p>
          <p className="text-xs text-slate-600">RP Griffiths Chartered Certified Accountants</p>
        </div>
      </div>
    </div>
  );
}

export default DiscoveryCompletePage;

