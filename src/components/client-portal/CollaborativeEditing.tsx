import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Edit3, 
  Eye, 
  UserPlus, 
  UserMinus,
  Send,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PortalDocument } from '../../types/clientPortal';
import { clientPortalApi } from '../../services/clientPortalApi';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  lastActive: string;
  isOnline: boolean;
  currentSection?: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
  replies: Comment[];
  resolved: boolean;
  section?: string;
}

interface CollaborativeEditingProps {
  portalId: string;
  document: PortalDocument;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: 'viewer' | 'editor' | 'admin';
  };
  onClose: () => void;
}

export const CollaborativeEditing: React.FC<CollaborativeEditingProps> = ({
  portalId,
  document,
  currentUser,
  onClose
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [newCollaboratorRole, setNewCollaboratorRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [loading, setLoading] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCollaborators();
    loadComments();
    startPresenceTracking();
    
    return () => {
      stopPresenceTracking();
    };
  }, [portalId, document.id]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const loadCollaborators = async () => {
    try {
      const response = await clientPortalApi.getDocumentCollaborators(portalId, document.id);
      setCollaborators(response.users);
    } catch (error) {
      console.error('Failed to load collaborators:', error);
    }
  };

  const loadComments = async () => {
    // In a real implementation, this would load comments from the API
    const mockComments: Comment[] = [
      {
        id: '1',
        authorId: 'user1',
        authorName: 'John Doe',
        content: 'This section needs more detail about the financial projections.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        replies: [],
        resolved: false,
        section: 'Financial Analysis'
      },
      {
        id: '2',
        authorId: 'user2',
        authorName: 'Jane Smith',
        content: 'I agree, let me add more context here.',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        replies: [],
        resolved: true,
        section: 'Financial Analysis'
      }
    ];
    setComments(mockComments);
  };

  const startPresenceTracking = () => {
    // In a real implementation, this would use WebSockets or Server-Sent Events
    const interval = setInterval(() => {
      // Simulate user activity
      const randomUsers = new Set<string>();
      collaborators.forEach(collaborator => {
        if (Math.random() > 0.3) {
          randomUsers.add(collaborator.id);
        }
      });
      setActiveUsers(randomUsers);
    }, 5000);

    return () => clearInterval(interval);
  };

  const stopPresenceTracking = () => {
    // Cleanup presence tracking
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: newComment,
      timestamp: new Date().toISOString(),
      replies: [],
      resolved: false,
      section: selectedSection
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim()) return;

    setLoading(true);
    try {
      await clientPortalApi.addDocumentCollaborator(
        portalId,
        document.id,
        newCollaboratorEmail,
        newCollaboratorRole
      );
      
      await loadCollaborators();
      setNewCollaboratorEmail('');
      setNewCollaboratorRole('viewer');
      setShowAddCollaborator(false);
    } catch (error) {
      console.error('Failed to add collaborator:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return;

    try {
      await clientPortalApi.removeDocumentCollaborator(portalId, document.id, userId);
      await loadCollaborators();
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-50';
      case 'editor': return 'text-blue-600 bg-blue-50';
      case 'viewer': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'editor';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Collaborative Editing</h2>
              <p className="text-sm text-gray-500">{document.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Document Content */}
            <div className="flex-1 p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Document Content</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {activeUsers.size} active users
                  </span>
                  <div className="flex -space-x-2">
                    {collaborators.slice(0, 3).map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium ${
                          activeUsers.has(collaborator.id) ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                        }`}
                        title={`${collaborator.name} (${collaborator.role})`}
                      >
                        {collaborator.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {collaborators.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-medium">
                        +{collaborators.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Sections */}
              <div className="space-y-4">
                {['Executive Summary', 'Financial Analysis', 'Risk Assessment', 'Recommendations'].map((section) => (
                  <div
                    key={section}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSection === section 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSection(section)}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{section}</h4>
                      <div className="flex items-center space-x-2">
                        {comments.filter(c => c.section === section && !c.resolved).length > 0 && (
                          <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                            {comments.filter(c => c.section === section && !c.resolved).length} comments
                          </span>
                        )}
                        {canEdit && (
                          <button className="p-1 text-gray-400 hover:text-blue-600">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="h-80 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Comments</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {comment.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{comment.authorName}</p>
                            <p className="text-xs text-gray-500">{formatTime(comment.timestamp)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {comment.resolved && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-2">{comment.content}</p>
                      
                      {comment.section && (
                        <span className="inline-block bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                          {comment.section}
                        </span>
                      )}
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              </div>

              {/* Add Comment */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Collaborators Sidebar */}
          <div className="w-80 border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Collaborators</h3>
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => setShowAddCollaborator(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        activeUsers.has(collaborator.id) ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        {collaborator.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{collaborator.name}</p>
                        <p className="text-xs text-gray-500">{collaborator.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(collaborator.role)}`}>
                        {collaborator.role}
                      </span>
                      {currentUser.role === 'admin' && collaborator.id !== currentUser.id && (
                        <button
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[
                  { action: 'commented on', section: 'Financial Analysis', user: 'John Doe', time: '2m ago' },
                  { action: 'edited', section: 'Risk Assessment', user: 'Jane Smith', time: '5m ago' },
                  { action: 'resolved comment in', section: 'Executive Summary', user: 'Mike Johnson', time: '10m ago' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.section}</span>
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add Collaborator Modal */}
        <AnimatePresence>
          {showAddCollaborator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Collaborator</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newCollaboratorEmail}
                      onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={newCollaboratorRole}
                      onChange={(e) => setNewCollaboratorRole(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddCollaborator(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCollaborator}
                    disabled={loading || !newCollaboratorEmail.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg"
                  >
                    {loading ? 'Adding...' : 'Add Collaborator'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}; 