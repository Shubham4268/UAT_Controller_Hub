import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITestSession extends Document {
    title: string;
    description: string;
    scope: string;
    iosLink: string;
    androidLink: string;
    androidAppLink?: string; // App download link
    iosAppLink?: string;     // App download link
    androidQr?: string;      // QR code URL or base64
    iosQr?: string;          // QR code URL or base64
    token: string;
    status: 'ACTIVE' | 'STOPPED';
    completionStatus: 'ACTIVE' | 'COMPLETED';
    startedAt?: Date;
    stoppedAt?: Date;
    completedAt?: Date;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TestSessionSchema: Schema<ITestSession> = new Schema(
    {
        title: { type: String, required: true, maxlength: 100 },
        description: { type: String, required: true },
        scope: {
            type: String,
            enum: ['UI', 'Functional', 'Both'],
            required: true,
        },
        iosLink: { type: String, required: true },
        androidLink: { type: String, required: true },
        androidAppLink: { type: String },
        iosAppLink: { type: String },
        androidQr: { type: String },
        iosQr: { type: String },
        token: { type: String, required: true, unique: true },
        status: {
            type: String,
            enum: ['ACTIVE', 'STOPPED'],
            default: 'STOPPED',
            required: true,
        },
        completionStatus: {
            type: String,
            enum: ['ACTIVE', 'COMPLETED'],
            default: 'ACTIVE',
            required: true,
        },
        startedAt: { type: Date },
        stoppedAt: { type: Date },
        completedAt: { type: Date },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

// Force model refresh to handle schema changes during development
if (mongoose.models.TestSession) {
    delete mongoose.models.TestSession;
}

const TestSession: Model<ITestSession> =
    mongoose.model<ITestSession>('TestSession', TestSessionSchema);

export default TestSession;
