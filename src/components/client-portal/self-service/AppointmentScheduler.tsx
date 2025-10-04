import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Phone, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
  duration: number;
}

interface AppointmentData {
  accountant_id: string;
  date: string;
  time: string;
  duration: number;
  type: 'video' | 'phone' | 'in-person';
  topic: string;
  notes?: string;
}

interface AppointmentSchedulerProps {
  accountantId: string;
  onSchedule: (appointment: AppointmentData) => Promise<void>;
}

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  accountantId,
  onSchedule
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [meetingType, setMeetingType] = useState<'video' | 'phone' | 'in-person'>('video');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch available time slots
  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [selectedDate]);

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      // API call to get available slots
      const response = await fetch(
        `/api/appointments/available-slots?accountant_id=${accountantId}&date=${date.toISOString()}`
      );
      const slots = await response.json();
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedSlot || !topic) return;

    try {
      await onSchedule({
        accountant_id: accountantId,
        date: selectedSlot.date,
        time: selectedSlot.time,
        duration: selectedSlot.duration,
        type: meetingType,
        topic,
        notes
      });
      
      // Show success message
      // Reset form
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
    }
  };

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const days = [];

    // Add padding days from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i));
    }

    return days;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs text-gray-400 py-2">
                {day}
              </div>
            ))}
            
            {generateCalendarDays().map((day, index) => (
              <button
                key={index}
                onClick={() => day && setSelectedDate(day)}
                disabled={!day || day < new Date()}
                className={`
                  aspect-square flex items-center justify-center rounded-lg
                  ${!day 
                    ? 'invisible' 
                    : day < new Date()
                    ? 'text-gray-600 cursor-not-allowed'
                    : day.toDateString() === selectedDate.toDateString()
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                  }
                `}
              >
                {day?.getDate()}
              </button>
            ))}
          </div>

          {/* Time Slots */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-400 mb-3">
              Available Times
            </h4>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {availableSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`
                      px-3 py-2 rounded-lg text-sm transition-colors
                      ${selectedSlot?.id === slot.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No available slots for this date</p>
            )}
          </div>
        </div>

        {/* Appointment Details */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Appointment Details
          </h3>

          {/* Meeting Type */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Meeting Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMeetingType('video')}
                className={`
                  px-3 py-2 rounded-lg flex items-center justify-center gap-2
                  ${meetingType === 'video'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                <Video className="w-4 h-4" />
                Video
              </button>
              <button
                onClick={() => setMeetingType('phone')}
                className={`
                  px-3 py-2 rounded-lg flex items-center justify-center gap-2
                  ${meetingType === 'phone'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                <Phone className="w-4 h-4" />
                Phone
              </button>
              <button
                onClick={() => setMeetingType('in-person')}
                className={`
                  px-3 py-2 rounded-lg flex items-center justify-center gap-2
                  ${meetingType === 'in-person'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                <MapPin className="w-4 h-4" />
                In-Person
              </button>
            </div>
          </div>

          {/* Topic */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              What would you like to discuss?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Tax planning, Financial review"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific questions or documents to discuss..."
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg resize-none"
              rows={4}
            />
          </div>

          {/* Summary */}
          {selectedSlot && (
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-gray-400 text-sm mb-2">Appointment Summary</p>
              <div className="space-y-1">
                <p className="text-white">
                  <Calendar className="w-4 h-4 inline mr-2 text-gray-400" />
                  {new Date(selectedSlot.date).toLocaleDateString()}
                </p>
                <p className="text-white">
                  <Clock className="w-4 h-4 inline mr-2 text-gray-400" />
                  {selectedSlot.time} ({selectedSlot.duration} minutes)
                </p>
                <p className="text-white capitalize">
                  {meetingType === 'video' && <Video className="w-4 h-4 inline mr-2 text-gray-400" />}
                  {meetingType === 'phone' && <Phone className="w-4 h-4 inline mr-2 text-gray-400" />}
                  {meetingType === 'in-person' && <MapPin className="w-4 h-4 inline mr-2 text-gray-400" />}
                  {meetingType.replace('-', ' ')} Meeting
                </p>
              </div>
            </div>
          )}

          {/* Schedule Button */}
          <button
            onClick={handleSchedule}
            disabled={!selectedSlot || !topic}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Schedule Appointment
          </button>
        </div>
      </div>
    </div>
  );
}; 