import mongoose, { Schema, Document, Model } from 'mongoose';

import { ROLES, type Role } from '../config/roles';

export interface IUser extends Document {
  name: string;
  username: string; // Added for First.Last format authentication
  email?: string; // Made optional for backward compatibility
  password?: string; // Optional in interface as it might be excluded in queries
  image?: string;
  role: Role; // specific roles can be expanded
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v: string) {
          // Validate First.Last format (e.g., John1.Doe, admin.user)
          // Allows letters and numbers
          return /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/.test(v);
        },
        message: 'Username must be in format First.Last (e.g., John.Doe)',
      },
    },
    email: { type: String, unique: true, sparse: true }, // sparse allows null/undefined for optional unique
    password: { type: String, required: true, select: false }, // Store hash, prevent auto-select
    image: { type: String },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.MEMBER,
    },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

// Pre-save hook to normalize username to lowercase
UserSchema.pre<IUser>('save', function () {
  if (this.isModified('username')) {
    this.username = this.username.trim().toLowerCase();
  }
});

// Prevent overwrite on hot reload
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
