import { Layout } from '@/components/Layout';

export default function ChatPage() {
  return (
    <Layout
      title="Ask Your AI Advisor"
      subtitle="Get instant help with your business transformation"
    >
      <div className="bg-white rounded-xl border border-slate-200 p-8 min-h-[500px]">
        <p className="text-slate-600 mb-8">
          AI chat interface will be implemented here.
        </p>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Coming Soon:</strong> This page will provide a conversational AI assistant
            that knows your business context and can help with tasks.
          </p>
        </div>
      </div>
    </Layout>
  );
}

