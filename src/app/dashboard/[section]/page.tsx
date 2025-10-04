import { DashboardLayout } from '@/components/dashboard/core/Layout';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';
import { Mountain, Target, Users, BookOpen, Link, MessageSquare, Gift, BarChart3 } from 'lucide-react';

const sectionConfig = {
  journey: { title: 'My Journey', icon: Mountain },
  roadmap: { title: '12-Week Plan', icon: Target },
  board: { title: 'AI Board', icon: Users },
  knowledge: { title: 'Knowledge Hub', icon: BookOpen },
  integrations: { title: 'Integrations', icon: Link },
  community: { title: 'Community', icon: MessageSquare },
  referral: { title: 'Referral Program', icon: Gift },
  analytics: { title: 'Analytics', icon: BarChart3 }
};

export default function DashboardSectionPage({ params }: { params: { section: string } }) {
  const config = sectionConfig[params.section as keyof typeof sectionConfig];
  
  if (!config) {
    return <div>Section not found</div>;
  }
  
  return (
    <DashboardLayout>
      <PlaceholderPage {...config} />
    </DashboardLayout>
  );
} 