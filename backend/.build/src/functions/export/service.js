"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const db_1 = require("../../lib/db");
class ExportService {
    /**
     * Export all user data as CSV
     */
    async exportUserData(userId) {
        // Fetch all data for the user
        const [batches, reminders, devices] = await Promise.all([
            db_1.entities.getUserBatches(userId),
            db_1.entities.getUserReminders(userId),
            db_1.entities.getUserDevices(userId),
        ]);
        // Get all events for all batches
        const allEvents = [];
        for (const batch of batches) {
            const events = await db_1.entities.getBatchEvents(batch.batchId);
            allEvents.push(...events);
        }
        // Combine all records into a single array
        const rows = [
            ...batches.map((b) => ({ recordType: 'batch', ...this.flattenObject(b) })),
            ...allEvents.map((e) => ({ recordType: 'event', ...this.flattenObject(e) })),
            ...reminders.map((r) => ({ recordType: 'reminder', ...this.flattenObject(r) })),
            ...devices.map((d) => ({ recordType: 'device', ...this.flattenObject(d) })),
        ];
        if (rows.length === 0) {
            return 'recordType\n'; // Empty CSV with header
        }
        // Get all unique keys across all rows
        const allKeys = new Set();
        rows.forEach((row) => {
            Object.keys(row).forEach((key) => allKeys.add(key));
        });
        const headers = Array.from(allKeys);
        // Generate CSV
        const csvLines = [];
        // Header row
        csvLines.push(headers.map(this.escapeCSV).join(','));
        // Data rows
        for (const row of rows) {
            const values = headers.map((header) => {
                const value = row[header];
                return this.escapeCSV(value !== undefined ? String(value) : '');
            });
            csvLines.push(values.join(','));
        }
        return csvLines.join('\n');
    }
    /**
     * Flatten nested objects for CSV export
     */
    flattenObject(obj, prefix = '') {
        const flattened = {};
        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (value === null || value === undefined) {
                flattened[newKey] = '';
            }
            else if (Array.isArray(value)) {
                flattened[newKey] = JSON.stringify(value);
            }
            else if (typeof value === 'object' && !(value instanceof Date)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            }
            else {
                flattened[newKey] = value;
            }
        }
        return flattened;
    }
    /**
     * Escape CSV values
     */
    escapeCSV(value) {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
}
exports.ExportService = ExportService;
//# sourceMappingURL=service.js.map