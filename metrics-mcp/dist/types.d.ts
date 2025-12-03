export type UserRole = 'viewer' | 'analyst' | 'admin';
export interface AuthContext {
    role: UserRole;
    name: string;
    apiKey: string;
}
export interface ApiKeyConfig {
    key: string;
    role: UserRole;
    name: string;
    description: string;
}
export type MetricCategory = 'revenue' | 'users' | 'performance' | 'engagement';
export type TrendDirection = 'up' | 'down' | 'stable';
export interface Metric {
    id: string;
    name: string;
    category: MetricCategory;
    value: number;
    unit: string;
    change: number;
    trend: TrendDirection;
    timestamp: string;
    previousValue?: number;
}
export type WidgetType = 'chart' | 'metric' | 'table';
export interface Widget {
    id: string;
    type: WidgetType;
    title: string;
    metricIds: string[];
    config: {
        chartType?: 'line' | 'bar' | 'pie';
        timeRange?: string;
        refreshInterval?: number;
    };
}
export interface Dashboard {
    id: string;
    name: string;
    description: string;
    category: string;
    widgets: Widget[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    isDefault: boolean;
    tags: string[];
}
export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    sections: string[];
    defaultPeriod: string;
    category: string;
}
export interface QueryResult {
    query: string;
    executedAt: string;
    rowCount: number;
    data: any[];
    executionTime: number;
    columns: string[];
}
export type ExportFormat = 'csv' | 'json' | 'xlsx';
export interface ExportResult {
    format: ExportFormat;
    filename: string;
    data: string;
    size: number;
    createdAt: string;
}
export interface UserInfo {
    apiKey: string;
    name: string;
    role: UserRole;
    createdAt: string;
    lastUsed?: string;
    requestCount: number;
}
//# sourceMappingURL=types.d.ts.map