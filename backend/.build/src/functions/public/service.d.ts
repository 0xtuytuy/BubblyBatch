export interface PublicBatchView {
    batchId: string;
    name: string;
    stage: string;
    status: string;
    startDate: string;
    publicNote?: string;
    createdAt: string;
}
export declare class PublicService {
    /**
     * Get public batch view (no auth required)
     */
    getPublicBatch(batchId: string): Promise<PublicBatchView>;
}
//# sourceMappingURL=service.d.ts.map