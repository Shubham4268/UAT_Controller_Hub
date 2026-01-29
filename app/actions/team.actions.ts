'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/mongo';
import User from '@/models/User';
import TeamMemberProfile from '@/models/TeamMemberProfile';
import MetricValue from '@/models/MetricValue';
import Metric from '@/models/Metric';
import { requireAdmin } from '@/lib/auth/authorization';
import mongoose from 'mongoose';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CreateTeamMemberInput = {
  name: string;
  username: string;
  password: string;
  jobTitle?: string; // e.g. "Associate QA"
  teamRole: string; // "Program Manager", "Team Lead", "Team Member"
  image?: string; // Cloudinary URL
  domain: string;
  issuesFound?: number;
  score?: number;
  projects?: string[];
  courses?: string[];
  skills?: string[];
  department?: string;
};

export type UpdateTeamMemberInput = {
  id: string; // User ID
  name?: string;
  jobTitle?: string;
  teamRole?: string;
  image?: string;
  domain?: string;
  issuesFound?: number;
  score?: number;
  projects?: string[];
  courses?: string[];
  skills?: string[];
  department?: string;
};

export type DeleteTeamMemberInput = {
  id: string; // User ID
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
 * Update or create a metric value for a user
 */
async function updateMetricValue(
  userId: mongoose.Types.ObjectId,
  metricName: string,
  value: number,
  unit: string,
  type: 'quantitative' | 'qualitative'
) {
  const metric = await getOrCreateMetric(metricName, unit, type);

  // Find existing metric value or create new one
  const existingMetricValue = await MetricValue.findOne({
    entityId: userId,
    entityType: 'User',
    metricId: metric._id,
  });

  if (existingMetricValue) {
    existingMetricValue.value = value;
    existingMetricValue.timestamp = new Date();
    await existingMetricValue.save();
  } else {
    await MetricValue.create({
      metricId: metric._id,
      entityId: userId,
      entityType: 'User',
      value,
      timestamp: new Date(),
    });
  }
}

/**
 * Validate create team member input
 */
/**
 * Validate create team member input
 */
function validateCreateInput(input: CreateTeamMemberInput): string | null {
  if (!input.name?.trim()) return 'Name is required';
  if (!input.username?.trim()) return 'Username is required';

  // Username format validation (First.Last, case-insensitive)
  if (!/^[a-zA-Z]+\.[a-zA-Z]+$/.test(input.username.trim())) {
    return 'Username must be in format First.Last (e.g., John.Doe)';
  }

  if (!input.password?.trim()) return 'Password is required';

  // Password complexity validation
  // Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(input.password)) {
    return 'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, and one number';
  }

  // Job title is optional (defaults to Associate QA in logic), but if provided, must be valid string
  // Role validation
  const allowedRoles = ['Program Manager', 'Team Lead', 'Team Member'];
  if (!input.teamRole || !allowedRoles.includes(input.teamRole)) {
    return 'Valid Role is required (Program Manager, Team Lead, Team Member)';
  }

  if (!input.domain?.trim()) return 'Domain is required';

  // Metrics validation only if NOT Program Manager
  if (input.teamRole !== 'Program Manager') {
    // If metrics are provided, validate them.
    // Note: Creating a member might not strictly require metrics initially,
    // but if provided they must be valid.
    if (
      input.issuesFound !== undefined &&
      (input.issuesFound < 0 || typeof input.issuesFound !== 'number')
    ) {
      return 'Issues Found must be a non-negative number';
    }
    if (
      input.score !== undefined &&
      (input.score < 0 || input.score > 100 || typeof input.score !== 'number')
    ) {
      return 'Score must be between 0 and 100';
    }
  }

  // Identify arrays validation
  if (input.projects && !Array.isArray(input.projects)) return 'Projects must be an array';
  if (input.courses && !Array.isArray(input.courses)) return 'Courses must be an array';
  if (input.skills && !Array.isArray(input.skills)) return 'Skills must be an array';

  return null;
}

/**
 * Validate update team member input
 */
function validateUpdateInput(input: UpdateTeamMemberInput): string | null {
  if (!input.id?.trim()) return 'User ID is required';

  // If role is being updated, validate it
  const allowedRoles = ['Program Manager', 'Team Lead', 'Team Member'];
  if (input.teamRole && !allowedRoles.includes(input.teamRole)) {
    return 'Valid Role is required (Program Manager, Team Lead, Team Member)';
  }

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

  return null;
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Create a new team member
 * Requires admin role
 */
export async function createTeamMember(
  input: CreateTeamMemberInput
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

    // Normalize username for case-insensitive storage
    const normalizedUsername = input.username.trim().toLowerCase();

    // Check if username already exists
    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return { success: false, error: 'Username already exists' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create User document
    const user = await User.create({
      name: input.name,
      username: normalizedUsername,
      password: hashedPassword,
      role: 'member', // System role is always 'member' for new team members
      image: input.image,
    });

    // Create TeamMemberProfile document
    // Create TeamMemberProfile document
    // Enforce logic: If Program Manager, skills are ignored (empty).
    const isProgramManager = input.teamRole === 'Program Manager';

    await TeamMemberProfile.create({
      userId: user._id,
      department: input.department || input.domain,
      jobTitle: input.jobTitle || 'Associate QA', // Default if missing
      teamRole: input.teamRole,
      skills: isProgramManager ? [] : input.skills || [], // Ignore skills for Program Manager
      availability: 'full-time',
    });

    // Create MetricValue for issuesFound
    // Enforce logic: If Program Manager, metrics are ignored.
    if (!isProgramManager && input.issuesFound !== undefined) {
      await updateMetricValue(user._id, 'Issues Found', input.issuesFound, 'count', 'quantitative');
    }

    // Create MetricValue for score
    // Enforce logic: If Program Manager, metrics are ignored.
    if (!isProgramManager && input.score !== undefined) {
      await updateMetricValue(user._id, 'Quality Score', input.score, 'points', 'quantitative');
    }

    // Revalidate ISG pages
    // Team page shows all team members - needs fresh data
    revalidatePath('/team');
    // Dashboard shows team member summaries - needs fresh data
    revalidatePath('/dashboard');

    return {
      success: true,
      data: { id: user._id.toString() },
    };
  } catch (error) {
    console.error('Error creating team member:', error);

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: 'Failed to create team member. Please try again.',
    };
  }
}

/**
 * Update an existing team member
 * Requires admin role
 */
export async function updateTeamMember(
  input: UpdateTeamMemberInput
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

    // Find user
    const user = await User.findById(input.id);
    if (!user) {
      return { success: false, error: 'Team member not found' };
    }

    // Update User document
    if (input.name !== undefined) user.name = input.name;
    if (input.image !== undefined) user.image = input.image;
    await user.save();

    // Update TeamMemberProfile
    // Update TeamMemberProfile
    const profile = await TeamMemberProfile.findOne({ userId: user._id });

    // Determine effective role (new or existing)
    const effectiveRole = input.teamRole || profile?.teamRole;
    const isProgramManager = effectiveRole === 'Program Manager';

    if (profile) {
      if (input.department !== undefined) profile.department = input.department;
      if (input.jobTitle !== undefined) profile.jobTitle = input.jobTitle;
      if (input.teamRole !== undefined) profile.teamRole = input.teamRole;

      // If Program Manager, we do not update skills (or ensure they are not set if invalid state)
      // Requirement: "Skills & Experience must be ignored"
      if (!isProgramManager && input.skills !== undefined) {
        profile.skills = input.skills;
      }

      if (input.domain !== undefined && !input.department) {
        profile.department = input.domain;
      }
      await profile.save();
    } else if (input.skills || input.department || input.domain) {
      // Create profile if it doesn't exist
      await TeamMemberProfile.create({
        userId: user._id,
        department: input.department || input.domain,
        jobTitle: input.jobTitle || 'Associate QA',
        teamRole: input.teamRole || 'Team Member',
        skills: isProgramManager ? [] : input.skills || [],
        availability: 'full-time',
      });
    }

    // Update MetricValues
    // Enforce logic: If Program Manager, ignore metrics updates
    if (!isProgramManager) {
      if (input.issuesFound !== undefined) {
        await updateMetricValue(
          user._id,
          'Issues Found',
          input.issuesFound,
          'count',
          'quantitative'
        );
      }

      if (input.score !== undefined) {
        await updateMetricValue(user._id, 'Quality Score', input.score, 'points', 'quantitative');
      }
    }

    // Revalidate ISG pages
    // Team page needs to show updated member data
    revalidatePath('/team');
    // Dashboard needs to show updated summaries
    revalidatePath('/dashboard');

    return {
      success: true,
      data: { id: user._id.toString() },
    };
  } catch (error) {
    console.error('Error updating team member:', error);

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: 'Failed to update team member. Please try again.',
    };
  }
}

/**
 * Delete a team member (soft delete)
 * Requires admin role
 */
export async function deleteTeamMember(input: DeleteTeamMemberInput): Promise<ActionResult> {
  try {
    // Authorization check
    await requireAdmin();

    if (!input.id?.trim()) {
      return { success: false, error: 'User ID is required' };
    }

    await connectDB();

    // Find user
    const user = await User.findById(input.id);
    if (!user) {
      return { success: false, error: 'Team member not found' };
    }

    // Soft delete: Set archivedAt
    user.archivedAt = new Date();
    await user.save();

    // Revalidate ISG pages
    // Team page filters out archived users - needs refresh to hide deleted member
    revalidatePath('/team');
    // Dashboard counts and summaries need to exclude deleted member
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error deleting team member:', error);

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return { success: false, error: error.message };
    }

    return {
      success: false,
      error: 'Failed to delete team member. Please try again.',
    };
  }
}
