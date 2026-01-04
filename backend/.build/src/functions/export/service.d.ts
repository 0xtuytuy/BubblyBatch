export declare class ExportService {
    /**
     * Export all user data as CSV
     */
    exportUserData(userId: string): Promise<string>;
    /**
     * Flatten nested objects for CSV export
     */
    private flattenObject;
    /**
     * Escape CSV values
     */
    private escapeCSV;
}
//# sourceMappingURL=service.d.ts.map