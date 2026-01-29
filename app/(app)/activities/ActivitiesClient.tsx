'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ActivityData } from '@/lib/data/activities';

type ActivitiesClientProps = {
  activities: ActivityData[];
  loading: boolean;
};

export default function ActivitiesClient({ activities, loading }: ActivitiesClientProps) {
  const [selectedActivity, setSelectedActivity] = useState<ActivityData | null>(null);

  return (
    <>
      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Loading activities...
          </div>
        ) : activities.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No activities found.
          </div>
        ) : (
          activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => setSelectedActivity(activity)}
              className="text-left p-6 border rounded-lg bg-card hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {/* Activity Image */}
              {activity.imageUrl ? (
                <img
                  src={activity.imageUrl}
                  alt={activity.title}
                  className="w-full h-32 object-cover rounded-md mb-4"
                />
              ) : (
                <div className="w-full h-32 rounded-md mb-4 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              )}

              {/* Activity Title */}
              <h3 className="font-semibold text-lg line-clamp-2">{activity.title}</h3>

              {/* Short Description */}
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {activity.shortDescription}
              </p>

              {/* Members */}
              <p className="text-sm font-medium text-foreground/80 mt-3">
                {activity.members.join(', ')}
              </p>

              {/* Metrics */}
              <div className="flex gap-6 mt-4 pt-4 border-t">
                {activity.issuesFound !== undefined && (
                  <div>
                    <p className="text-2xl font-bold">{activity.issuesFound}</p>
                    <p className="text-xs text-muted-foreground">Issues Found</p>
                  </div>
                )}
                <div>
                  <p className="text-2xl font-bold">{activity.score}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Activity Details Modal */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="max-w-2xl">
          {selectedActivity && (
            <>
              <DialogHeader>
                {/* Activity Image */}
                {selectedActivity.imageUrl ? (
                  <img
                    src={selectedActivity.imageUrl}
                    alt={selectedActivity.title}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                ) : (
                  <div className="w-full h-48 rounded-md mb-4 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                )}
                <DialogTitle className="text-2xl">{selectedActivity.title}</DialogTitle>
                <DialogDescription className="capitalize">
                  {selectedActivity.category}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Full Description */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                    Description
                  </h3>
                  <p className="text-sm leading-relaxed">{selectedActivity.fullDescription}</p>
                </div>

                {/* Metrics Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedActivity.issuesFound !== undefined && (
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-3xl font-bold">{selectedActivity.issuesFound}</p>
                        <p className="text-sm text-muted-foreground mt-1">Issues Found</p>
                      </div>
                    )}
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <p className="text-3xl font-bold">{selectedActivity.score}</p>
                      <p className="text-sm text-muted-foreground mt-1">Impact Score</p>
                    </div>
                  </div>
                </div>

                {/* Contributors Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Contributors
                  </h3>
                  <ul className="space-y-2">
                    {selectedActivity.members.map((member, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground mt-1">•</span>
                        <span className="text-sm">{member}</span>
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
