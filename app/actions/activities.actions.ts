'use server';

import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db/mongo';
import Activity from '@/models/Activity';
import ActivityContribution from '@/models/ActivityContribution';
import MetricValue from '@/models/MetricValue';
import Metric from '@/models/Metric';
import { requireAdmin } from '@/lib/auth/authorization';
import mongoose from 'mongoose';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CreateActivityInput = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  memberIds: string[]; // Array of User IDs
  issuesFound?: number; // Optional
  score: number;
  category: 'project' | 'initiative' | 'extra';
};

export type UpdateActivityInput = {
  id: string; // Activity ID
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
  memberIds?: string[];
  issuesFound?: number;
  score?: number;
  category?: 'project' | 'initiative' | 'extra';
};

export type DeleteActivityInput = {
  id: string; // Activity ID
};

export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map UI category to database activity type
 */
function categoryToType(
  category: 'project' | 'initiative' | 'extra'
): 'project' | 'task' | 'event' {
  switch (category) {
    case 'project':
      return 'project';
    case 'initiative':
      return 'task';
    case 'extra':
      return 'event';
  }
}

/**
 * Get or create a metric by name
 */
async function getOrCreateMetric(name: string, unit: string, type: 'quantitative' | 'qualitative') {
  let metric = await Metric.findOne({ name });

  if (!metric) {
    metric = await Metric.create({
      name,
      unit,
      type,
      description: `Auto-created metric for ${name}`,
    });
  }

  return metric;
}

/**
 * Update or create a metric value for an activity
 */
async function updateMetricValue(
  activityId: mongoose.Types.ObjectId,
  metricName: string,
  value: number,
  unit: string,
  type: 'quantitative' | 'qualitative'
) {
  const metric = await getOrCreateMetric(metricName, unit, type);

  // Find existing metric value or create new one
  const existingMetricValue = await MetricValue.findOne({
    entityId: activityId,
    entityType: 'Activity',
    metricId: metric._id,
  });

  if (existingMetricValue) {
    existingMetricValue.value = value;
    existingMetricValue.timestamp = new Date();
    await existingMetricValue.save();
  } else {
    await MetricValue.create({
      metricId: metric._id,
      entityId: activityId,
      entityType: 'Activity',
      value,
      timestamp: new Date(),
    });
  }
}

/**
 * Validate create activity input
 */
function validateCreateInput(input: CreateActivityInput): string | null {
  if (!input.title?.trim()) return 'Title is required';
  if (!input.shortDescription?.trim()) return 'Short description is required';
  if (!input.fullDescription?.trim()) return 'Full description is required';
  if (!Array.isArray(input.memberIds)) return 'Member IDs must be an array';

  if (input.issuesFound !== undefined) {
    if (typeof input.issuesFound !== 'number' || input.issuesFound < 0) {
      return 'Issues Found must be a non-negative number';
    }
  }

  if (typeof input.score !== 'number' || input.score < 0 || input.score > 100) {
    return 'Score must be between 0 and 100';
  }

  if (!['project', 'initiative', 'extra'].includes(input.category)) {
    return 'Category must be project, initiative, or extra';
  }

  return null;
}

/**
 * Validate update activity input
 */
function validateUpdateInput(input: UpdateActivityInput): string | null {
  if (!input.id?.trim()) return 'Activity ID is required';

  if (input.issuesFound !== undefined) {
    if (typeof input.issuesFound !== 'number' || input.issuesFound < 0) {
      return 'Issues Found must be a non-negative number';
    }
  }

  if (input.score !== undefined) {
    if (typeof input.score !== 'number' || input.score < 0 || input.score > 100) {
      return 'Score must be between 0 and 100';
    }
  }

  if (input.category !== undefined) {
    if (!['project', 'initiative', 'extra'].includes(input.category)) {
      return 'Category must be project, initiative, or extra';
    }
  }

  return null;
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Create a new activity
 * Requires admin role
 */
export async function createActivity(
  input: CreateActivityInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Authorization check
    await requireAdmin();

    // Validate input
    const validationError = validateCreateInput(input);
    if (validationError) {
      return { success: false, error: validationError };
    }

    await connectDB();

    // Map category to activity type
    const activityType = categoryToType(input.category);

    // Create Activity document
    const activity = await Activity.create({
      title: input.title,
      description: input.fullDescription,
      type: activityType,
      status: 'pending', // Default status
    });

    // Create ActivityContribution documents for each member
    if (input.memberIds.length > 0) {
      const contributions = input.memberIds.map((userId) => ({
        activityId: activity._id,
        userId: new mongoose.Types.ObjectId(userId),
        role: 'contributor', // Default role
      }));

      await ActivityContribution.insertMany(contributions);
    }

    // Create MetricValue for issuesFound (if provided)
    if (input.issuesFound !== undefined) {
      await updateMetricValue(
        activity._id,
        'Issues Found',
        input.issuesFound,
        'count',
        'quantitative'
      );
    }

    // Create MetricValue for score (always)
    await updateMetricValue(activity._id, 'Impact Score', input.score, 'points', 'quantitative');

    // Revalidate ISG pages
    // Activities page shows all activities - needs fresh data
    revalidatePath('/activities');
    // Dashboard shows activity summaries - needs fresh data
    revalidatePath('/dashboard');

    return {
      success: true,
      data: { id: activity._id.toString() },
    };
  } catch (error) {
    console.error('Error creating activity:', error);

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: 'Failed to create activity. Please try again.',
    };
  }
}

/**
 * Update an existing activity
 * Requires admin role
 */
export async function updateActivity(
  input: UpdateActivityInput
): Promise<ActionResult<{ id: string }>> {
  try {
    // Authorization check
    await requireAdmin();

    // Validate input
    const validationError = validateUpdateInput(input);
    if (validationError) {
      return { success: false, error: validationError };
    }

    await connectDB();

    // Find activity
    const activity = await Activity.findById(input.id);
    if (!activity) {
      return { success: false, error: 'Activity not found' };
    }

    // Update Activity document
    if (input.title !== undefined) activity.title = input.title;
    if (input.fullDescription !== undefined) activity.description = input.fullDescription;
    if (input.category !== undefined) {
      activity.type = categoryToType(input.category);
    }
    await activity.save();

    // Update ActivityContributions if memberIds provided
    if (input.memberIds !== undefined) {
      // Delete existing contributions
      await ActivityContribution.deleteMany({ activityId: activity._id });

      // Create new contributions
      if (input.memberIds.length > 0) {
        const contributions = input.memberIds.map((userId) => ({
          activityId: activity._id,
          userId: new mongoose.Types.ObjectId(userId),
          role: 'contributor',
        }));

        await ActivityContribution.insertMany(contributions);
      }
    }

    // Update MetricValues
    if (input.issuesFound !== undefined) {
      await updateMetricValue(
        activity._id,
        'Issues Found',
        input.issuesFound,
        'count',
        'quantitative'
      );
    }

    if (input.score !== undefined) {
      await updateMetricValue(activity._id, 'Impact Score', input.score, 'points', 'quantitative');
    }

    // Revalidate ISG pages
    // Activities page needs to show updated activity data
    revalidatePath('/activities');
    // Dashboard needs to show updated summaries
    revalidatePath('/dashboard');

    return {
      success: true,
      data: { id: activity._id.toString() },
    };
  } catch (error) {
    console.error('Error updating activity:', error);

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: 'Failed to update activity. Please try again.',
    };
  }
}

/**
 * Delete an activity (soft delete)
 * Requires admin role
 */
export async function deleteActivity(input: DeleteActivityInput): Promise<ActionResult> {
  try {
    // Authorization check
    await requireAdmin();

    if (!input.id?.trim()) {
      return { success: false, error: 'Activity ID is required' };
    }

    await connectDB();

    // Find activity
    const activity = await Activity.findById(input.id);
    if (!activity) {
      return { success: false, error: 'Activity not found' };
    }

    // Soft delete: Set archivedAt
    activity.archivedAt = new Date();
    await activity.save();

    // Revalidate ISG pages
    // Activities page filters out archived activities - needs refresh to hide deleted activity
    revalidatePath('/activities');
    // Dashboard counts and summaries need to exclude deleted activity
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error deleting activity:', error);

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: 'Failed to delete activity. Please try again.',
    };
  }
}
