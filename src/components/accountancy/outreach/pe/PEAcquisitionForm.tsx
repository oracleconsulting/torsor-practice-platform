import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { PEAcquisition } from '@/types/outreach';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { outreachService } from '@/services/accountancy/outreachService';

const peAcquisitionSchema = z.object({
  acquiring_firm: z.string().min(1, 'Acquiring firm is required'),
  target_firm: z.string().min(1, 'Target firm is required'),
  acquisition_date: z.string().min(1, 'Acquisition date is required'),
  estimated_clients: z.number().min(0, 'Must be 0 or greater'),
  status: z.enum(['new', 'processing', 'extracted', 'completed']),
  deal_value: z.string().optional(),
  sector: z.string().optional()
});

type PEAcquisitionFormData = z.infer<typeof peAcquisitionSchema>;

interface PEAcquisitionFormProps {
  acquisition?: PEAcquisition;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PEAcquisitionForm: React.FC<PEAcquisitionFormProps> = ({
  acquisition,
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
  } = useForm<PEAcquisitionFormData>({
    resolver: zodResolver(peAcquisitionSchema),
    defaultValues: acquisition || {
      status: 'new',
      estimated_clients: 0
    }
  });

  const onSubmit = async (data: PEAcquisitionFormData) => {
    if (!practice?.id) return;

    try {
      if (acquisition?.id) {
        await outreachService.updatePEAcquisition(acquisition.id, data);
        toast({
          title: 'Success',
          description: 'PE acquisition updated successfully',
        });
      } else {
        await outreachService.createPEAcquisition(practice.id, data);
        toast({
          title: 'Success',
          description: 'PE acquisition created successfully',
        });
        reset();
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving PE acquisition:', error);
      toast({
        title: 'Error',
        description: 'Failed to save PE acquisition. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {acquisition ? 'Edit PE Acquisition' : 'Add New PE Acquisition'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Acquiring Firm *
              </label>
              <Input
                {...register('acquiring_firm')}
                placeholder="Name of acquiring PE firm"
                className={errors.acquiring_firm ? 'border-red-500' : ''}
              />
              {errors.acquiring_firm && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.acquiring_firm.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Target Firm *
              </label>
              <Input
                {...register('target_firm')}
                placeholder="Name of target accounting firm"
                className={errors.target_firm ? 'border-red-500' : ''}
              />
              {errors.target_firm && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.target_firm.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Acquisition Date *
              </label>
              <Input
                type="date"
                {...register('acquisition_date')}
                className={errors.acquisition_date ? 'border-red-500' : ''}
              />
              {errors.acquisition_date && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.acquisition_date.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Estimated Clients *
              </label>
              <Input
                type="number"
                {...register('estimated_clients', { valueAsNumber: true })}
                placeholder="0"
                min="0"
                className={errors.estimated_clients ? 'border-red-500' : ''}
              />
              {errors.estimated_clients && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.estimated_clients.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Deal Value
              </label>
              <Input
                {...register('deal_value')}
                placeholder="e.g., £25M"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Sector
              </label>
              <Input
                {...register('sector')}
                placeholder="e.g., Professional Services"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <Select
                {...register('status')}
                defaultValue={acquisition?.status || 'new'}
              >
                <option value="new">New</option>
                <option value="processing">Processing</option>
                <option value="extracted">Extracted</option>
                <option value="completed">Completed</option>
              </Select>
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
              {isSubmitting
                ? 'Saving...'
                : acquisition
                ? 'Update Acquisition'
                : 'Add Acquisition'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PEAcquisitionForm; 