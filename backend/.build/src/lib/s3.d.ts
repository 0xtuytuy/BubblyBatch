export declare const s3: {
    /**
     * Generate a presigned URL for uploading a photo (or mock URL in offline mode)
     */
    getUploadUrl(key: string, contentType?: string): Promise<string>;
    /**
     * Generate a presigned URL for downloading a photo (or mock URL in offline mode)
     */
    getDownloadUrl(key: string): Promise<string>;
    /**
     * Delete a photo from S3 (or from offline storage)
     */
    deletePhoto(key: string): Promise<void>;
    /**
     * Generate a unique key for a photo
     */
    generatePhotoKey(userId: string, batchId: string, filename: string): string;
};
//# sourceMappingURL=s3.d.ts.map