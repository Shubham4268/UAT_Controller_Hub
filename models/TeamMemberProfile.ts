import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeamMemberProfile extends Document {
  userId: mongoose.Types.ObjectId;
  department?: string;
  jobTitle?: string;
  teamRole?: string;
  skills: string[];
  availability: 'full-time' | 'part-time' | 'contract' | 'unavailable';
  contactInfo?: Record<string, string>; // Flexible contact details
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberProfileSchema: Schema<ITeamMemberProfile> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    department: { type: String },
    jobTitle: { type: String },
    teamRole: { type: String },
    skills: [{ type: String }],
    availability: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'unavailable'],
      default: 'full-time',
    },
    contactInfo: { type: Map, of: String },
  },
  { timestamps: true }
);

const TeamMemberProfile: Model<ITeamMemberProfile> =
  mongoose.models.TeamMemberProfile ||
  mongoose.model<ITeamMemberProfile>('TeamMemberProfile', TeamMemberProfileSchema);

export default TeamMemberProfile;
