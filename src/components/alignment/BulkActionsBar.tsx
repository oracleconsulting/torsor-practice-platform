import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  PencilSquareIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import {
  bulkActionsService
} from '../../services/alignmentEnhancementsService';

interface BulkActionsBarProps {
  practiceId: string;
  oracleGroupId: string;
  selectedTaskIds: string[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export function BulkActionsBar({
  practiceId,
  oracleGroupId,
  selectedTaskIds,
  onClearSelection,
  onActionComplete
}: BulkActionsBarProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'complete' | 'uncomplete' | 'delete' | 'add_notes';
    notes?: string;
  } | null>(null);
  const [executing, setExecuting] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  if (selectedTaskIds.length === 0) return null;

  const handleAction = (action: 'complete' | 'uncomplete' | 'delete' | 'add_notes') => {
    if (action === 'add_notes') {
      setPendingAction({ type: action });
      setShowConfirmation(true);
    } else {
      setPendingAction({ type: action });
      setShowConfirmation(true);
    }
  };

  const executeAction = async () => {
    if (!pendingAction) return;

    setExecuting(true);
    try {
      let success = false;
      const userId = 'current-user-id'; // TODO: Get from auth context

      switch (pendingAction.type) {
        case 'complete':
          success = await bulkActionsService.bulkCompleteTasks(
            practiceId,
            oracleGroupId,
            selectedTaskIds,
            userId
          );
          break;
        case 'uncomplete':
          success = await bulkActionsService.bulkUncompleteTasks(
            practiceId,
            oracleGroupId,
            selectedTaskIds,
            userId
          );
          break;
        case 'delete':
          success = await bulkActionsService.bulkDeleteTasks(
            practiceId,
            oracleGroupId,
            selectedTaskIds,
            userId
          );
          break;
        case 'add_notes':
          if (noteInput.trim()) {
            success = await bulkActionsService.bulkAddNotes(
              practiceId,
              oracleGroupId,
              selectedTaskIds,
              noteInput.trim(),
              userId
            );
          }
          break;
      }

      if (success) {
        onActionComplete();
        onClearSelection();
        setShowConfirmation(false);
        setPendingAction(null);
        setNoteInput('');
      } else {
        alert('Failed to perform bulk action');
      }
    } catch (error) {
      console.error('Error executing bulk action:', error);
      alert('Error performing bulk action');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <>
      {/* Bulk Actions Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
        <div className="bg-gray-900 text-white rounded-lg shadow-2xl px-6 py-4 flex items-center space-x-4">
          {/* Selected Count */}
          <div className="flex items-center space-x-3">
            <Badge className="bg-blue-500 text-white text-sm px-3 py-1">
              {selectedTaskIds.length} selected
            </Badge>
            <button
              onClick={onClearSelection}
              className="text-gray-300 hover:text-white transition-colors"
              title="Clear selection"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-600" />

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('complete')}
              className="bg-green-600 hover:bg-green-700 text-white border-none"
              title="Mark as complete"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Complete
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('uncomplete')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white border-none"
              title="Mark as incomplete"
            >
              <XMarkIcon className="w-4 h-4 mr-2" />
              Uncomplete
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('add_notes')}
              className="bg-blue-600 hover:bg-blue-700 text-white border-none"
              title="Add notes to selected"
            >
              <PencilSquareIcon className="w-4 h-4 mr-2" />
              Add Note
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('delete')}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
              title="Delete selected"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Bulk Action
            </h3>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                You are about to{' '}
                <strong>
                  {pendingAction.type === 'complete' && 'mark as complete'}
                  {pendingAction.type === 'uncomplete' && 'mark as incomplete'}
                  {pendingAction.type === 'delete' && 'delete'}
                  {pendingAction.type === 'add_notes' && 'add notes to'}
                </strong>{' '}
                <strong className="text-blue-600">{selectedTaskIds.length}</strong> task
                {selectedTaskIds.length !== 1 ? 's' : ''}.
              </p>

              {pendingAction.type === 'delete' && (
                <p className="text-red-600 text-sm mt-2">
                  ⚠️ This action cannot be undone.
                </p>
              )}

              {pendingAction.type === 'add_notes' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note to add to all selected tasks:
                  </label>
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter note..."
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setPendingAction(null);
                  setNoteInput('');
                }}
                disabled={executing}
              >
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                disabled={executing || (pendingAction.type === 'add_notes' && !noteInput.trim())}
                className={
                  pendingAction.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : pendingAction.type === 'complete'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }
              >
                {executing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Task Checkbox Component for use in task lists
export function TaskCheckbox({
  taskId,
  checked,
  onChange,
  disabled = false
}: {
  taskId: string;
  checked: boolean;
  onChange: (taskId: string, checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={`task-${taskId}`}
        checked={checked}
        onChange={(e) => onChange(taskId, e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
      />
    </div>
  );
}

// Select All Component
export function SelectAllCheckbox({
  taskIds,
  selectedTaskIds,
  onSelectAll,
  onDeselectAll
}: {
  taskIds: string[];
  selectedTaskIds: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  const allSelected = taskIds.length > 0 && taskIds.every(id => selectedTaskIds.includes(id));
  const someSelected = selectedTaskIds.length > 0 && !allSelected;

  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={allSelected}
        ref={(el) => {
          if (el) el.indeterminate = someSelected;
        }}
        onChange={() => {
          if (allSelected || someSelected) {
            onDeselectAll();
          } else {
            onSelectAll();
          }
        }}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
      />
      <Squares2X2Icon className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-700">
        {allSelected ? 'Deselect All' : someSelected ? `${selectedTaskIds.length} Selected` : 'Select All'}
      </span>
    </div>
  );
}

