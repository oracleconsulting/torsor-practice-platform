import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { Prospect } from '@/types/outreach';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';

const prospectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  position: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(['new', 'researched', 'contacted', 'responded', 'converted']),
  personalization_data: z.object({
    opening_hook: z.string().optional(),
    pe_context: z.string().optional(),
    research_insights: z.array(z.string()).optional()
  }).optional()
});

type ProspectFormData = z.infer<typeof prospectSchema>;

interface ProspectFormProps {
  prospect?: Prospect;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ProspectForm: React.FC<ProspectFormProps> = ({
  prospect,
  onSuccess,
  onCancel
}) => {
  const { practice } = useAccountancyContext();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ProspectFormData>({
    resolver: zodResolver(prospectSchema),
    defaultValues: prospect || {
      status: 'new',
      personalization_data: {
        research_insights: []
      }
    }
  });

  const onSubmit = async (data: ProspectFormData) => {
    if (!practice?.id) return;

    try {
      if (prospect?.id) {
        await outreachService.updateProspect(prospect.id, data);
        toast({
          title: 'Success',
          description: 'Prospect updated successfully',
        });
      } else {
        await outreachService.createProspect(practice.id, data);
        toast({
          title: 'Success',
          description: 'Prospect created successfully',
        });
        reset();
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving prospect:', error);
      toast({
        title: 'Error',
        description: 'Failed to save prospect. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{prospect ? 'Edit Prospect' : 'Add New Prospect'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Basic Information */}
            <div>
              <label className="text-sm font-medium text-gray-700">Name *</label>
              <Input
                {...register('name')}
                placeholder="Contact name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Company *</label>
              <Input
                {...register('company')}
                placeholder="Company name"
                className={errors.company ? 'border-red-500' : ''}
              />
              {errors.company && (
                <p className="text-sm text-red-500 mt-1">{errors.company.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Position</label>
              <Input
                {...register('position')}
                placeholder="Job title"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Industry</label>
              <Input
                {...register('industry')}
                placeholder="Industry sector"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select
                {...register('status')}
                defaultValue={prospect?.status || 'new'}
              >
                <option value="new">New</option>
                <option value="researched">Researched</option>
                <option value="contacted">Contacted</option>
                <option value="responded">Responded</option>
                <option value="converted">Converted</option>
              </Select>
            </div>

            {/* Personalization Data */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personalization</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Opening Hook</label>
                  <Textarea
                    {...register('personalization_data.opening_hook')}
                    placeholder="Personalized opening message"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">PE Context</label>
                  <Textarea
                    {...register('personalization_data.pe_context')}
                    placeholder="Relevant PE acquisition context"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Research Insights</label>
                  <div className="space-y-2">
                    {prospect?.personalization_data?.research_insights?.map((insight, index) => (
                      <Input
                        key={index}
                        {...register(`personalization_data.research_insights.${index}`)}
                        defaultValue={insight}
                      />
                    ))}
                    <Input
                      {...register('personalization_data.research_insights.0')}
                      placeholder="Add research insight"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Saving...' : prospect ? 'Update Prospect' : 'Add Prospect'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProspectForm; 