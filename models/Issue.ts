import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IIssue extends Document {
    sessionId: mongoose.Types.ObjectId;
    testerId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    media?: string; // URL to image/video
    severity?: 'Blocker' | 'Critical' | 'Major' | 'Normal' | 'Minor';
    deviceDetails?: string;
    osVersion?: string;
    leadComment?: string;
    status: 'NOT_VALIDATED' | 'VALIDATED' | 'NA';
    validatedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const IssueSchema: Schema<IIssue> = new Schema(
    {
        sessionId: { type: Schema.Types.ObjectId, ref: 'TestSession', required: true },
        testerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        deviceDetails: { type: String },
        osVersion: { type: String },
        media: { type: String },
        severity: {
            type: String,
            enum: ['Blocker', 'Critical', 'Major', 'Normal', 'Minor'],
        },
        leadComment: { type: String },
        status: {
            type: String,
            enum: ['NOT_VALIDATED', 'VALIDATED', 'NA'],
            default: 'NOT_VALIDATED',
        },
        validatedAt: { type: Date },
    },
    { timestamps: true }
);

if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Issue;
}

const Issue: Model<IIssue> =
    mongoose.models.Issue || mongoose.model<IIssue>('Issue', IssueSchema);

export default Issue;
