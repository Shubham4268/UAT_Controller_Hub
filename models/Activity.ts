import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
  title: string;
  description?: string;
  image?: string; // Cloudinary URL or other image URL
  type: 'project' | 'task' | 'milestone' | 'event';
  status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'archived';
  dueDate?: Date;
  metadata?: Record<string, unknown>; // Flexible metadata for different activity types
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

const ActivitySchema: Schema<IActivity> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['project', 'task', 'milestone', 'event'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'blocked', 'archived'],
      default: 'pending',
    },
    dueDate: { type: Date },
    metadata: { type: Map, of: Schema.Types.Mixed }, // Use Mixed for flexible JSON-like structure
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;
