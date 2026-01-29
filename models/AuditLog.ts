import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId; // Who did it? (Optional if system or guest)
  action: string; // What happened?
  resource: string; // What was affected? (e.g., 'Activity', 'User')
  resourceId?: mongoose.Types.ObjectId; // ID of the affecting resource
  metadata?: Record<string, unknown>; // Changed fields, previous values, etc.
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId },
    metadata: { type: Map, of: Schema.Types.Mixed },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now, expires: '90d' }, // TTL index: auto-delete after 90 days
  },
  { timestamps: false } // No updatedAt needed, immutable log. CreatedAt is 'timestamp'
);

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
