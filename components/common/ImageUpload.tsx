'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getUploadSignature } from '@/app/actions/media.actions';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  name: string;
  defaultValue?: string;
}

export function ImageUpload({ name, defaultValue }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(defaultValue || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setError(null);
    setIsUploading(true);

    try {
      // 1. Get signature for secure upload
      const { timestamp, signature, cloudName, apiKey, folder } = await getUploadSignature();

      // 2. Upload to Cloudinary directly
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey || '');
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      // Update state with the secure URL
      setImageUrl(data.secure_url);
    } catch (err) {
      console.error(err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting same file again if needed
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    setImageUrl('');
  };

  return (
    <div className="space-y-4">
      {/* Hidden input to pass value to parent form */}
      <input type="hidden" name={name} value={imageUrl} />

      {imageUrl ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-muted/20">
          <Image src={imageUrl} alt="Uploaded" fill className="object-cover" sizes="128px" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive transition-colors"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isUploading}
              aria-label="Upload image"
            />
            <Button type="button" variant="outline" disabled={isUploading} className="relative">
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Image
            </Button>
          </div>
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      )}
    </div>
  );
}
