import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMetric extends Document {
  name: string;
  description?: string;
  unit: string; // e.g., 'story_points', 'count', 'hours', 'percent'
  target?: number; // Optional target value
  type: 'qualitative' | 'quantitative';
  createdAt: Date;
  updatedAt: Date;
}

const MetricSchema: Schema<IMetric> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    unit: { type: String, required: true },
    target: { type: Number },
    type: { 
      type: String, 
      enum: ['qualitative', 'quantitative'], 
      required: true 
    },
  },
  { timestamps: true }
);

const Metric: Model<IMetric> = mongoose.models.Metric || mongoose.model<IMetric>('Metric', MetricSchema);

export default Metric;
