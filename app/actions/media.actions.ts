'use server';

import cloudinary from '@/lib/cloudinary/client';
import Media from '@/models/Media';
import { connectDB } from '@/lib/db/mongo';
import { env } from '@/config/env';

// Type definition for Cloudinary persistence
type SaveMediaParams = {
  publicId: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'other';
  mimeType?: string;
  size?: number;
  userId: string; // ID of the user uploading the file
};

/**
 * 1. Generate a secure upload signature for client-side uploads.
 * This prevents exposing the API secret to the client.
 */
export async function getUploadSignature(folder: string = 'teamboard_uploads') {
  // Use a timestamp to permit the upload for a limited window
  const timestamp = Math.round((new Date()).getTime() / 1000);

  // Sign the parameters we want to enforce
  const signature = cloudinary.utils.api_sign_request({
    timestamp,
    folder,
  }, env.CLOUDINARY_API_SECRET!);

  return {
    timestamp,
    signature,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder
  };
}

/**
 * 2. Persist media metadata to MongoDB after successful upload.
 * We trust the client to send us the result of the signed upload,
 * but valid IDs and URLs are coming from Cloudinary response on client.
 */
export async function persistMedia(params: SaveMediaParams) {
  try {
    await connectDB();

    const { publicId, url, type, mimeType, size, userId } = params;

    const newMedia = await Media.create({
      url,
      publicId,
      type,
      mimeType,
      size,
      uploadedBy: userId, // In a real scenario, derive this from session
    });

    // Return a plain object to be compatible with Server Action serialization
    return {
      success: true,
      data: JSON.parse(JSON.stringify(newMedia)), // method to ensure simple object
    };
  } catch (error) {
    console.error('Failed to persist media:', error);
    return {
      success: false,
      error: 'Failed to save media metadata',
    };
  }
}
