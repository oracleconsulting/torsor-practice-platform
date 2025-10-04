import { useState, useEffect, useRef } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { 
  notificationService, 
  type AlignmentNotification 
} from '../../services/alignmentEnhancementsService';

interface NotificationCenterProps {
  practiceId: string;
  userId: string;
  onNotificationClick?: (notification: AlignmentNotification) => void;
}

export function NotificationCenter({ practiceId, userId, onNotificationClick }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<AlignmentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notifications
    const unsubscribe = notificationService.subscribeToNotifications(
      practiceId,
      handleNewNotification
    );

    return () => unsubscribe();
  }, [practiceId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await notificationService.getNotifications(practiceId, 50);
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.is_read).length);
    setLoading(false);
  };

  const handleNewNotification = (notification: AlignmentNotification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Play notification sound (optional)
    // new Audio('/notification.mp3').play().catch(() => {});
    
    // Show browser notification (optional)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png'
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    
    const success = await notificationService.markAsRead(notificationId, userId);
    if (success) {
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await notificationService.markAllAsRead(practiceId, userId);
    if (success) {
      setNotifications(prev => prev.map(n => ({ 
        ...n, 
        is_read: true, 
        read_at: new Date().toISOString() 
      })));
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = (notification: AlignmentNotification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
      setIsOpen(false);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="w-6 h-6 text-blue-600" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <BellIcon className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {filter === 'unread' 
                    ? "You're all caught up!" 
                    : "We'll notify you when something important happens"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={(e) => handleMarkAsRead(notification.id, e)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="w-full"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Mark All as Read
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Notification Item Component
interface NotificationItemProps {
  notification: AlignmentNotification;
  onClick: () => void;
  onMarkAsRead: (e: React.MouseEvent) => void;
}

function NotificationItem({ notification, onClick, onMarkAsRead }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.notification_type) {
      case 'week_completed':
      case 'sprint_completed':
      case 'milestone_completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'task_overdue':
      case 'progress_stalled':
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />;
      case 'roadmap_updated':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'call_scheduled':
        return <ClockIcon className="w-5 h-5 text-purple-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityBorder = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-4 border-l-red-500';
      case 'high':
        return 'border-l-4 border-l-orange-500';
      case 'normal':
        return 'border-l-4 border-l-blue-500';
      case 'low':
        return 'border-l-4 border-l-gray-300';
      default:
        return 'border-l-4 border-l-gray-300';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${getPriorityBorder()} ${
        !notification.is_read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getTimeAgo(notification.created_at)}
              </p>
            </div>

            {/* Unread Indicator & Actions */}
            <div className="flex items-center space-x-2 ml-2">
              {!notification.is_read && (
                <>
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <button
                    onClick={onMarkAsRead}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Mark as read"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Priority Badge */}
          {notification.priority !== 'normal' && (
            <Badge 
              className={`mt-2 text-xs ${
                notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}
            >
              {notification.priority}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact notification badge for header
export function NotificationBadge({ practiceId }: { practiceId: string }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const notifications = await notificationService.getUnreadNotifications(practiceId);
      setUnreadCount(notifications.length);
    };

    loadCount();

    // Subscribe to updates
    const unsubscribe = notificationService.subscribeToNotifications(
      practiceId,
      () => loadCount()
    );

    return () => unsubscribe();
  }, [practiceId]);

  if (unreadCount === 0) return null;

  return (
    <Badge className="bg-red-500 text-white">
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
}

