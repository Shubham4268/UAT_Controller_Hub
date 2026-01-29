'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TeamMemberData } from '@/lib/data/team';

type TeamMembersClientProps = {
  teamMembers: TeamMemberData[];
  loading: boolean;
};

export default function TeamMembersClient({ teamMembers, loading }: TeamMembersClientProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMemberData | null>(null);

  return (
    <>
      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Loading team members...
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No team members found.
          </div>
        ) : (
          teamMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="text-left p-6 border rounded-lg bg-card hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-4">
                {member.imageUrl ? (
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-lg font-semibold">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  {/* Member Name */}
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  {/* Role */}
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>

              {/* Domain */}
              <p className="text-sm font-medium text-foreground/80 mt-2">{member.domain}</p>

              {/* Stats */}
              <div className="flex gap-6 mt-4 pt-4 border-t">
                <div>
                  <p className="text-2xl font-bold">{member.issuesFound}</p>
                  <p className="text-xs text-muted-foreground">Issues Found</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{member.score}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Member Details Modal */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMember && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-2">
                  {selectedMember.imageUrl ? (
                    <img
                      src={selectedMember.imageUrl}
                      alt={selectedMember.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl font-semibold">
                      {selectedMember.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <DialogTitle className="text-2xl">{selectedMember.name}</DialogTitle>
                    <DialogDescription>
                      {selectedMember.role} • {selectedMember.domain}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Stats Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-3xl font-bold">{selectedMember.issuesFound}</p>
                      <p className="text-sm text-muted-foreground mt-1">Total Issues Found</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-3xl font-bold">{selectedMember.score}</p>
                      <p className="text-sm text-muted-foreground mt-1">Quality Score</p>
                    </div>
                  </div>
                </div>

                {/* Projects Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Active Projects
                  </h3>
                  <ul className="space-y-2">
                    {selectedMember.projects.map((project, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span className="text-sm">{project}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Courses Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Completed Courses
                  </h3>
                  <ul className="space-y-2">
                    {selectedMember.courses.map((course, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span className="text-sm">{course}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
