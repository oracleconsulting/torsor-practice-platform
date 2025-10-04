import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';
import { Contact } from '@/types/outreach';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash, Tag as TagIcon } from 'lucide-react';

interface ContactFormProps {
  contactId?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({ contactId }) => {
  const { practice } = useAccountancyContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<Partial<Contact>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'active',
    tags: [],
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const loadContact = async () => {
      if (contactId && contactId !== 'new' && practice?.id) {
        try {
          setLoading(true);
          const data = await outreachService.getContacts(practice.id);
          const found = data.find((c: Contact) => c.id === contactId);
          if (found) {
            setContact(found);
          }
        } catch (error) {
          console.error('Error loading contact:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadContact();
  }, [contactId, practice?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practice?.id) return;

    try {
      setLoading(true);
      if (contactId && contactId !== 'new') {
        await outreachService.updateContact(contactId, contact);
      } else {
        await outreachService.createContact(practice.id, contact);
      }
      navigate('/accountancy/outreach/contacts');
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contactId || contactId === 'new' || !confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      setLoading(true);
      // Add delete method to service
      navigate('/accountancy/outreach/contacts');
    } catch (error) {
      console.error('Error deleting contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      const tags = contact.tags || [];
      if (!tags.includes(newTag.trim())) {
        setContact({ ...contact, tags: [...tags, newTag.trim()] });
      }
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const tags = contact.tags || [];
    setContact({ ...contact, tags: tags.filter(tag => tag !== tagToRemove) });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/accountancy/outreach/contacts')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Button>
        {contactId && contactId !== 'new' && (
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash className="w-4 h-4" />
            Delete Contact
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{contactId === 'new' ? 'Add Contact' : 'Edit Contact'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  placeholder="Enter contact name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  type="tel"
                  value={contact.phone || ''}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <Input
                  value={contact.company || ''}
                  onChange={(e) => setContact({ ...contact, company: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <Input
                  value={contact.position || ''}
                  onChange={(e) => setContact({ ...contact, position: e.target.value })}
                  placeholder="Enter position/role"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={contact.status}
                  onValueChange={(value) => setContact({ ...contact, status: value as Contact['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {contact.tags?.map((tag, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-gray-400" />
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type a tag and press Enter"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/accountancy/outreach/contacts')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Contact'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}; 