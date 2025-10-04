import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Mail, 
  Users, 
  CheckCircle, 
  AlertCircle,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { clientPortalApi } from '../services/clientPortalApi';
import { toast } from 'sonner';

interface InviteClientModalProps {
  portalId: string;
  onClose: () => void;
  onInviteSent?: (inviteData: any) => void;
}

interface InviteFormData {
  email: string;
  name: string;
  role: 'client' | 'viewer' | 'editor' | 'admin';
  message: string;
  sendWelcomeEmail: boolean;
  setPassword: boolean;
}

export const InviteClientModal: React.FC<InviteClientModalProps> = ({
  portalId,
  onClose,
  onInviteSent
}) => {
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    name: '',
    role: 'client',
    message: '',
    sendWelcomeEmail: true,
    setPassword: false
  });
  
  const [loading, setLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await clientPortalApi.inviteClient(portalId, formData);
      
      if (response.status === 'success') {
        setInviteData(response.data);
        setInviteSent(true);
        toast.success('Client invited successfully!');
        onInviteSent?.(response.data);
      } else {
        toast.error(response.message || 'Failed to send invite');
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (inviteData?.invite_url) {
      navigator.clipboard.writeText(inviteData.invite_url);
      toast.success('Invite link copied to clipboard!');
    }
  };

  const handleInputChange = (field: keyof InviteFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (inviteSent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invite Sent Successfully!</h2>
            <p className="text-gray-600 mb-6">
              An invitation has been sent to <strong>{formData.email}</strong>
            </p>

            {inviteData?.invite_url && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Invite Link
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={inviteData.invite_url}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    onClick={copyInviteLink}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setInviteSent(false);
                  setFormData({
                    email: '',
                    name: '',
                    role: 'client',
                    message: '',
                    sendWelcomeEmail: true,
                    setPassword: false
                  });
                }}
                className="flex-1"
              >
                Invite Another Client
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <UserPlus className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Invite Client</h2>
              <p className="text-sm text-gray-500">Send an invitation to join your portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="client@example.com"
              required
              className="mt-1"
            />
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Full Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="John Doe"
              required
              className="mt-1"
            />
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role" className="text-sm font-medium text-gray-700">
              Role *
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === 'client' && 'Full access to documents and features'}
              {formData.role === 'viewer' && 'Can view documents only'}
              {formData.role === 'editor' && 'Can view and edit documents'}
              {formData.role === 'admin' && 'Full administrative access'}
            </p>
          </div>

          {/* Personal Message */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
              Personal Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Add a personal message to your invitation..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="sendWelcomeEmail"
                checked={formData.sendWelcomeEmail}
                onChange={(e) => handleInputChange('sendWelcomeEmail', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="sendWelcomeEmail" className="text-sm text-gray-700">
                Send welcome email with portal information
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="setPassword"
                checked={formData.setPassword}
                onChange={(e) => handleInputChange('setPassword', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="setPassword" className="text-sm text-gray-700">
                Allow client to set their own password
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.email || !formData.name}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}; 