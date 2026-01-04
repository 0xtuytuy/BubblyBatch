"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicService = void 0;
const db_1 = require("../../lib/db");
const errors_1 = require("../../utils/errors");
class PublicService {
    /**
     * Get public batch view (no auth required)
     */
    async getPublicBatch(batchId) {
        const batch = await db_1.entities.getBatchById(batchId);
        if (!batch) {
            throw new errors_1.NotFoundError('Batch not found');
        }
        if (!batch.isPublic) {
            throw new errors_1.ForbiddenError('This batch is not publicly shared');
        }
        // Return only public-safe information
        return {
            batchId: batch.batchId,
            name: batch.name,
            stage: batch.stage,
            status: batch.status,
            startDate: batch.startDate,
            publicNote: batch.publicNote,
            createdAt: batch.createdAt,
        };
    }
}
exports.PublicService = PublicService;
//# sourceMappingURL=service.js.map