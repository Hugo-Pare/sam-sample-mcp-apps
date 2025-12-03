import { Metric, Dashboard, Widget, ReportTemplate, QueryResult, ExportResult, ExportFormat, UserInfo } from './types.js';
export declare function getAllDashboards(category?: string): Dashboard[];
export declare function getDashboardById(dashboardId: string): Dashboard | null;
export declare function createDashboard(name: string, widgets: Widget[], createdBy: string): Dashboard;
export declare function getMetric(metricId: string, timeRange?: string): Metric;
export declare function executeQuery(query: string, parameters?: Record<string, any>): QueryResult;
export declare function getReportTemplates(): ReportTemplate[];
export declare function generateReport(reportType: string, dateRange: {
    start: string;
    end: string;
}): any;
export declare function getSampleDataset(): any;
export declare function exportData(metricIds: string[], format: ExportFormat): ExportResult;
export declare function listUsers(): UserInfo[];
export declare function createUser(name: string, role: string): UserInfo;
export declare function revokeUser(apiKey: string): {
    success: boolean;
    message: string;
};
export declare function getAvailableMetricIds(): string[];
//# sourceMappingURL=metrics-data.d.ts.map