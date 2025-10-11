/**
 * TeamDirectory Component
 * PROMPT 6: Onboarding Checklist System
 * 
 * Meet your colleagues - team member directory
 */

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Briefcase, Star, MessageCircle, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department?: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  bio?: string;
  expertise?: string[];
  isMentor?: boolean;
  joinedDate?: string;
  funFact?: string;
}

interface TeamDirectoryProps {
  members: TeamMember[];
  onConnect?: (memberId: string) => void;
  onMessage?: (memberId: string) => void;
  showConnectButtons?: boolean;
}

export const TeamDirectory: React.FC<TeamDirectoryProps> = ({
  members,
  onConnect,
  onMessage,
  showConnectButtons = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Filter members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments
  const departments = ['all', ...Array.from(new Set(members.map(m => m.department).filter(Boolean)))];

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-indigo-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Meet Your Team 👋</h2>
        <p className="text-muted-foreground">
          Get to know your colleagues and start building connections
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {departments.map((dept) => (
            <Button
              key={dept}
              variant={selectedDepartment === dept ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDepartment(dept)}
              className="whitespace-nowrap"
            >
              {dept === 'all' ? 'All Teams' : dept}
            </Button>
          ))}
        </div>
      </div>

      {/* Member Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredMembers.length} of {members.length} team members
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {/* Header with Avatar */}
              <div className="flex items-start gap-4 mb-4">
                <Avatar className={`h-16 w-16 ${getAvatarColor(member.name)}`}>
                  <AvatarFallback className="text-white text-lg font-semibold">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{member.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                  {member.department && (
                    <Badge variant="secondary" className="mt-1">
                      {member.department}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Bio */}
              {member.bio && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {member.bio}
                </p>
              )}

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a
                    href={`mailto:${member.email}`}
                    className="text-primary hover:underline truncate"
                  >
                    {member.email}
                  </a>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{member.phone}</span>
                  </div>
                )}
                {member.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{member.location}</span>
                  </div>
                )}
              </div>

              {/* Expertise */}
              {member.expertise && member.expertise.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Briefcase className="h-3 w-3" />
                    <span>Expertise:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {member.expertise.slice(0, 3).map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {member.expertise.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{member.expertise.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Mentor Badge */}
              {member.isMentor && (
                <div className="mb-4">
                  <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
                    <Star className="h-3 w-3 mr-1" />
                    Available as Mentor
                  </Badge>
                </div>
              )}

              {/* Fun Fact */}
              {member.funFact && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    <span className="font-semibold">Fun fact:</span> {member.funFact}
                  </p>
                </div>
              )}

              {/* Actions */}
              {showConnectButtons && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onMessage?.(member.id)}
                    className="flex-1"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onConnect?.(member.id)}
                    className="flex-1"
                  >
                    <User className="h-4 w-4 mr-1" />
                    Connect
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No team members found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{members.length}</div>
          <div className="text-sm text-muted-foreground">Total Members</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {members.filter(m => m.isMentor).length}
          </div>
          <div className="text-sm text-muted-foreground">Mentors Available</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {departments.length - 1}
          </div>
          <div className="text-sm text-muted-foreground">Departments</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {Array.from(new Set(members.flatMap(m => m.expertise || []))).length}
          </div>
          <div className="text-sm text-muted-foreground">Total Skills</div>
        </div>
      </div>
    </div>
  );
};

