import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedia extends Document {
  url: string;
  publicId?: string; // Cloudinary public_id
  type: 'image' | 'video' | 'document' | 'other';
  mimeType?: string;
  size?: number; // in bytes
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema: Schema<IMedia> = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    type: { 
      type: String, 
      enum: ['image', 'video', 'document', 'other'], 
      default: 'other' 
    },
    mimeType: { type: String },
    size: { type: Number },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // auditing who uploaded it
  },
  { timestamps: true }
);

const Media: Model<IMedia> = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
