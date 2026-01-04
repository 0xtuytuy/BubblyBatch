import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

export const s3 = {
  /**
   * Generate a presigned URL for uploading a photo
   */
  async getUploadUrl(key: string, contentType: string = 'image/jpeg'): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  },

  /**
   * Generate a presigned URL for downloading a photo
   */
  async getDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
  },

  /**
   * Delete a photo from S3
   */
  async deletePhoto(key: string): Promise<void> {
    await s3Client.send(
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

