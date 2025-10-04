import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Download, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface EmailCaptureFormProps {
  title: string;
  description: string;
  resourceType: 'assessment' | 'template' | 'report';
  onSuccess: () => void;
  onClose: () => void;
}

export function EmailCaptureForm({ title, description, resourceType, onSuccess, onClose }: EmailCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [consented, setConsented] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(true);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsValidEmail(newEmail === '' || validateEmail(newEmail));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setIsValidEmail(false);
      return;
    }

    if (!consented) {
      toast.error('Please consent to receive emails');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('community_leads')
        .insert({
          email,
          resource_type: resourceType,
          consented,
          source_page: '/community',
          utm_campaign: `free_${resourceType}`
        });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Success! Check your email for the download link.');
      
      // Auto-close after success
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md mx-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="h-6 w-6" />
              Success!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-gray-300 mb-4">
              We've sent the {resourceType === 'assessment' ? 'assessment' : resourceType === 'template' ? 'template' : 'report'} to your email.
            </p>
            <p className="text-sm text-gray-400">
              Don't forget to check your spam folder!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-400">
            <Download className="h-5 w-5" />
            {title}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-300 mb-6 text-sm">
            {description}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="founder@yourcompany.com"
                className={`bg-gray-800 border-gray-600 text-white mt-1 ${
                  !isValidEmail ? 'border-red-500' : ''
                }`}
                required
              />
              {!isValidEmail && (
                <p className="text-red-400 text-xs mt-1">Please enter a valid email address</p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="consent"
                checked={consented}
                onCheckedChange={(checked) => setConsented(checked as boolean)}
                className="border-gray-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <Label htmlFor="consent" className="text-xs text-gray-400 leading-relaxed">
                I consent to receive emails from Oracle Method with founder resources and community updates. 
                You can unsubscribe at any time.
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting || !email || !consented}
            >
              {isSubmitting ? 'Sending...' : `Get ${resourceType === 'assessment' ? 'Assessment' : resourceType === 'template' ? 'Template' : 'Report'}`}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
