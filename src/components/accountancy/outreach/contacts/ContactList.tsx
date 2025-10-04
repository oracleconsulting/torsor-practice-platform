import React, { useEffect, useState } from 'react';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { Contact } from '@/types/outreach';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Mail, Phone, Tag, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ContactList = () => {
  const { practice } = useAccountancyContext();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadContacts = async () => {
      try {
        if (practice?.id) {
          const data = await outreachService.getContacts(practice.id);
          setContacts(data);
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [practice?.id]);

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'inactive':
        return 'text-gray-500';
      case 'unsubscribed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return <div>Loading contacts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
        <Button onClick={() => navigate('new')} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Contact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <Card 
            key={contact.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(contact.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">
                {contact.name}
              </CardTitle>
              {contact.company && (
                <p className="text-sm text-gray-500">{contact.company}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {contact.email}
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {contact.phone}
                  </div>
                )}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <span className={`text-sm font-medium ${getStatusColor(contact.status)}`}>
                    {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredContacts.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No contacts found</h3>
            <p className="text-gray-500 mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Add your first contact to get started'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => navigate('new')} 
                variant="outline"
                className="mt-4"
              >
                Add Contact
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 