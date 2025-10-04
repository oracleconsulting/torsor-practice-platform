import React from 'react';
import { useParams } from 'react-router-dom';
import { ScheduleList } from './ScheduleList';
import { ScheduleForm } from './ScheduleForm';

export const SchedulePage = () => {
  const { scheduleId } = useParams();

  // If no scheduleId is provided, show the list view
  if (!scheduleId) {
    return <ScheduleList />;
  }

  // If scheduleId is 'new', show the create form
  if (scheduleId === 'new') {
    return <ScheduleForm />;
  }

  // Otherwise, show the edit form for the specific schedule item
  return <ScheduleForm scheduleId={scheduleId} />;
}; 