import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMetricValue extends Document {
  metricId: mongoose.Types.ObjectId;
  entityId: mongoose.Types.ObjectId; // Could be a User, Activity, or Team
  entityType: 'User' | 'Activity' | 'Team'; // Polymorphic reference helper
  value: number | string; // Numeric or qualitative value
  context?: Record<string, unknown>; // Extra context (e.g. "Sprint 5")
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MetricValueSchema: Schema<IMetricValue> = new Schema(
  {
    metricId: { type: Schema.Types.ObjectId, ref: 'Metric', required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityType: { 
      type: String, 
      enum: ['User', 'Activity', 'Team'], 
      required: true 
    },
    value: { type: Schema.Types.Mixed, required: true }, // Mixed to allow numbers or strings
    context: { type: Map, of: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for quick lookup of metrics for an entity
MetricValueSchema.index({ entityId: 1, metricId: 1, timestamp: -1 });

const MetricValue: Model<IMetricValue> = mongoose.models.MetricValue || mongoose.model<IMetricValue>('MetricValue', MetricValueSchema);

export default MetricValue;
