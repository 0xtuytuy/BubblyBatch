"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const IS_OFFLINE = process.env.IS_OFFLINE === 'true';
const BUCKET_NAME = process.env.BUCKET_NAME;
// In-memory storage for offline mode
const offlinePhotoStorage = new Map();
const s3Client = IS_OFFLINE ? null : new client_s3_1.S3Client({});
exports.s3 = {
    /**
     * Generate a presigned URL for uploading a photo (or mock URL in offline mode)
     */
    async getUploadUrl(key, contentType = 'image/jpeg') {
        if (IS_OFFLINE) {
            const mockUrl = `http://localhost:3000/_mock/s3/upload/${encodeURIComponent(key)}`;
            console.log(`[OFFLINE S3] Mock upload URL: ${key}`);
            return mockUrl;
        }
        const command = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });
        return await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 3600 }); // 1 hour
    },
    /**
     * Generate a presigned URL for downloading a photo (or mock URL in offline mode)
     */
    async getDownloadUrl(key) {
        if (IS_OFFLINE) {
            const mockUrl = `http://localhost:3000/_mock/s3/download/${encodeURIComponent(key)}`;
            console.log(`[OFFLINE S3] Mock download URL: ${key}`);
            return mockUrl;
        }
        const command = new client_s3_1.GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        return await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 3600 }); // 1 hour
    },
    /**
     * Delete a photo from S3 (or from offline storage)
     */
    async deletePhoto(key) {
        if (IS_OFFLINE) {
            const deleted = offlinePhotoStorage.delete(key);
            console.log(`[OFFLINE S3] DELETE ${key} - ${deleted ? 'success' : 'not found'}`);
            return;
        }
        await s3Client.send(new client_s3_1.DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        }));
    },
    /**
     * Generate a unique key for a photo
     */
    generatePhotoKey(userId, batchId, filename) {
        const timestamp = Date.now();
        const extension = filename.split('.').pop() || 'jpg';
        return `users/${userId}/batches/${batchId}/${timestamp}.${extension}`;
    },
};
//# sourceMappingURL=s3.js.map