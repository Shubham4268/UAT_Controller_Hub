import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityContribution extends Document {
  activityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'assignee' | 'reviewer' | 'contributor';
  hoursSpent?: number;
  artifacts?: mongoose.Types.ObjectId[]; // Links to Media or other resources
  createdAt: Date;
  updatedAt: Date;
}

const ActivityContributionSchema: Schema<IActivityContribution> = new Schema(
  {
    activityId: { type: Schema.Types.ObjectId, ref: 'Activity', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { 
      type: String, 
      enum: ['owner', 'assignee', 'reviewer', 'contributor'], 
      default: 'contributor' 
    },
    hoursSpent: { type: Number, default: 0 },
    artifacts: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
  },
  { timestamps: true }
);

// Compound index to prevent duplicate roles for same user on same activity if needed?
// Or maybe a user can have multiple roles? Let's keep it flexible for now, but usually unique per activity-user pair is good.
ActivityContributionSchema.index({ activityId: 1, userId: 1 }, { unique: true });

const ActivityContribution: Model<IActivityContribution> = mongoose.models.ActivityContribution || mongoose.model<IActivityContribution>('ActivityContribution', ActivityContributionSchema);

export default ActivityContribution;
