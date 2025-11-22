import React, { useState } from 'react';
import { BookOpen, Ticket } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KnowledgeBasePage from '../../team/KnowledgeBasePage';
import TicketsAdmin from '../TicketsAdmin';

/**
 * Knowledge & Support Tab - Knowledge base and support tickets
 * 
 * Consolidates 2 tabs:
 * - KNOWLEDGE BASE
 * - TICKETS
 */
const KnowledgeSupportTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('knowledge');

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <Card className="border-2 border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-orange-600" />
            Knowledge & Support
          </CardTitle>
          <CardDescription className="text-base">
            Access knowledge base resources and manage support tickets
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sub-navigation */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 gap-2 bg-gray-100 p-2 rounded-lg max-w-md">
          <TabsTrigger
            value="knowledge"
            className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-semibold">Knowledge Base</span>
          </TabsTrigger>
          <TabsTrigger
            value="tickets"
            className="flex items-center gap-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
          >
            <Ticket className="w-4 h-4" />
            <span className="font-semibold">Support Tickets</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge">
          <KnowledgeBasePage />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeSupportTab;

