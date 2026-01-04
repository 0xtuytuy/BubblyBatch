import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const IS_OFFLINE = process.env.IS_OFFLINE === 'true';
const BUCKET_NAME = process.env.BUCKET_NAME!;

// In-memory storage for offline mode
const offlinePhotoStorage = new Map<string, Buffer>();

const s3Client = IS_OFFLINE ? null : new S3Client({});

export const s3 = {
  /**
   * Generate a presigned URL for uploading a photo (or mock URL in offline mode)
   */
  async getUploadUrl(key: string, contentType: string = 'image/jpeg'): Promise<string> {
    if (IS_OFFLINE) {
      const mockUrl = `http://localhost:3000/_mock/s3/upload/${encodeURIComponent(key)}`;
      console.log(`[OFFLINE S3] Mock upload URL: ${key}`);
      return mockUrl;
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(s3Client!, command, { expiresIn: 3600 }); // 1 hour
  },

  /**
   * Generate a presigned URL for downloading a photo (or mock URL in offline mode)
   */
  async getDownloadUrl(key: string): Promise<string> {
    if (IS_OFFLINE) {
      const mockUrl = `http://localhost:3000/_mock/s3/download/${encodeURIComponent(key)}`;
      console.log(`[OFFLINE S3] Mock download URL: ${key}`);
      return mockUrl;
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client!, command, { expiresIn: 3600 }); // 1 hour
  },

  /**
   * Delete a photo from S3 (or from offline storage)
   */
  async deletePhoto(key: string): Promise<void> {
    if (IS_OFFLINE) {
      const deleted = offlinePhotoStorage.delete(key);
      console.log(`[OFFLINE S3] DELETE ${key} - ${deleted ? 'success' : 'not found'}`);
      return;
    }

    await s3Client!.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
  },

  /**
   * Generate a unique key for a photo
   */
  generatePhotoKey(userId: string, batchId: string, filename: string): string {
    const timestamp = Date.now();
    const extension = filename.split('.').pop() || 'jpg';
    return `users/${userId}/batches/${batchId}/${timestamp}.${extension}`;
  },
};

