import React, { useState } from 'react';
import { FileText, Calendar, Clock, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentRequestTemplate } from '../types/clientPortal';

interface DocumentRequestFlowProps {
  templates: DocumentRequestTemplate[];
  onSubmit: (request: DocumentRequest) => Promise<void>;
}

export const DocumentRequestFlow: React.FC<DocumentRequestFlowProps> = ({
  templates,
  onSubmit
}) => {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentRequestTemplate | null>(null);
  const [customRequest, setCustomRequest] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedTemplate && !customRequest) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        template_id: selectedTemplate?.id,
        custom_request: customRequest,
        due_date: dueDate,
        priority,
        notes: additionalNotes,
        status: 'pending'
      });
      
      // Show success
      setStep(4);
    } catch (error) {
      console.error('Failed to submit request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              What document do you need?
            </h3>
            
            {/* Template options */}
            <div className="space-y-3">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setStep(2);
                  }}
                  className="w-full p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">{template.name}</p>
                      <p className="text-gray-400 text-sm">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Custom request option */}
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setStep(2);
                }}
                className="w-full p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Other Document</p>
                    <p className="text-gray-400 text-sm">Request a custom document</p>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              {selectedTemplate ? 'Configure your request' : 'Describe what you need'}
            </h3>

            {!selectedTemplate && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Document Description
                </label>
                <textarea
                  value={customRequest}
                  onChange={(e) => setCustomRequest(e.target.value)}
                  placeholder="Please describe the document you need..."
                  className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg resize-none"
                  rows={4}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                When do you need this?
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`
                      px-4 py-2 rounded-lg capitalize transition-colors
                      ${priority === p 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }
                    `}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any additional information..."
                className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedTemplate && !customRequest.trim()}
                className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Review Request
              </button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Review Your Request
            </h3>

            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-gray-400 text-sm">Document Type</p>
                <p className="text-white">
                  {selectedTemplate?.name || 'Custom Request'}
                </p>
              </div>

              {customRequest && (
                <div>
                  <p className="text-gray-400 text-sm">Description</p>
                  <p className="text-white">{customRequest}</p>
                </div>
              )}

              <div>
                <p className="text-gray-400 text-sm">Due Date</p>
                <p className="text-white">
                  {dueDate ? new Date(dueDate).toLocaleDateString() : 'Not specified'}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Priority</p>
                <p className="text-white capitalize">{priority}</p>
              </div>

              {additionalNotes && (
                <div>
                  <p className="text-gray-400 text-sm">Additional Notes</p>
                  <p className="text-white">{additionalNotes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Request Submitted!
            </h3>
            <p className="text-gray-400 mb-6">
              We'll process your request and notify you when the document is ready.
            </p>
            <button
              onClick={() => {
                // Reset form
                setStep(1);
                setSelectedTemplate(null);
                setCustomRequest('');
                setDueDate('');
                setPriority('medium');
                setAdditionalNotes('');
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Submit Another Request
            </button>
          </motion.div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
}; 