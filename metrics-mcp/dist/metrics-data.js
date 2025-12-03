import { getAllApiKeys } from './auth.js';
const PREDEFINED_DASHBOARDS = [
    {
        id: 'dash_revenue_001',
        name: 'Revenue Overview',
        description: 'Track revenue metrics and financial performance',
        category: 'finance',
        widgets: [
            {
                id: 'widget_001',
                type: 'chart',
                title: 'Monthly Recurring Revenue',
                metricIds: ['revenue_mrr'],
                config: { chartType: 'line', timeRange: '12m' },
            },
            {
                id: 'widget_002',
                type: 'metric',
                title: 'Annual Revenue',
                metricIds: ['revenue_arr'],
                config: {},
            },
        ],
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isDefault: true,
        tags: ['finance', 'revenue'],
    },
    {
        id: 'dash_users_002',
        name: 'User Engagement',
        description: 'Monitor user activity and engagement metrics',
        category: 'users',
        widgets: [
            {
                id: 'widget_003',
                type: 'chart',
                title: 'Active Users',
                metricIds: ['users_dau', 'users_mau'],
                config: { chartType: 'line', timeRange: '30d' },
            },
            {
                id: 'widget_004',
                type: 'table',
                title: 'Top Features',
                metricIds: ['engagement_features'],
                config: {},
            },
        ],
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isDefault: true,
        tags: ['users', 'engagement'],
    },
    {
        id: 'dash_perf_003',
        name: 'Performance Metrics',
        description: 'System performance and response time monitoring',
        category: 'performance',
        widgets: [
            {
                id: 'widget_005',
                type: 'chart',
                title: 'Response Time',
                metricIds: ['perf_response_time'],
                config: { chartType: 'line', timeRange: '7d' },
            },
            {
                id: 'widget_006',
                type: 'metric',
                title: 'Uptime',
                metricIds: ['perf_uptime'],
                config: {},
            },
        ],
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isDefault: true,
        tags: ['performance', 'monitoring'],
    },
    {
        id: 'dash_exec_004',
        name: 'Executive Summary',
        description: 'High-level KPIs and business metrics',
        category: 'executive',
        widgets: [
            {
                id: 'widget_007',
                type: 'metric',
                title: 'Total Revenue',
                metricIds: ['revenue_arr'],
                config: {},
            },
            {
                id: 'widget_008',
                type: 'metric',
                title: 'Total Users',
                metricIds: ['users_total'],
                config: {},
            },
            {
                id: 'widget_009',
                type: 'chart',
                title: 'Growth Trend',
                metricIds: ['revenue_mrr', 'users_mau'],
                config: { chartType: 'bar', timeRange: '12m' },
            },
        ],
        createdBy: 'system',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        isDefault: true,
        tags: ['executive', 'kpi'],
    },
];
const METRIC_DEFINITIONS = {
    revenue_mrr: { name: 'Monthly Recurring Revenue', category: 'revenue', unit: 'USD' },
    revenue_arr: { name: 'Annual Recurring Revenue', category: 'revenue', unit: 'USD' },
    revenue_churn: { name: 'Revenue Churn Rate', category: 'revenue', unit: '%' },
    users_dau: { name: 'Daily Active Users', category: 'users', unit: 'users' },
    users_mau: { name: 'Monthly Active Users', category: 'users', unit: 'users' },
    users_total: { name: 'Total Users', category: 'users', unit: 'users' },
    users_retention: { name: 'User Retention Rate', category: 'users', unit: '%' },
    perf_response_time: { name: 'Average Response Time', category: 'performance', unit: 'ms' },
    perf_uptime: { name: 'System Uptime', category: 'performance', unit: '%' },
    perf_throughput: { name: 'Request Throughput', category: 'performance', unit: 'req/s' },
    engagement_session_duration: { name: 'Average Session Duration', category: 'engagement', unit: 'minutes' },
    engagement_features: { name: 'Feature Usage', category: 'engagement', unit: 'count' },
};
const REPORT_TEMPLATES = [
    {
        id: 'report_monthly_001',
        name: 'Monthly Business Review',
        description: 'Comprehensive monthly performance report',
        sections: ['Executive Summary', 'Revenue Analysis', 'User Growth', 'Key Metrics'],
        defaultPeriod: '1m',
        category: 'business',
    },
    {
        id: 'report_quarterly_002',
        name: 'Quarterly Performance Report',
        description: 'Quarterly KPI and goal tracking report',
        sections: ['Q Summary', 'Goal Progress', 'Trends', 'Recommendations'],
        defaultPeriod: '3m',
        category: 'executive',
    },
    {
        id: 'report_technical_003',
        name: 'Technical Performance Report',
        description: 'System performance and reliability metrics',
        sections: ['Uptime Analysis', 'Performance Metrics', 'Incidents', 'Optimizations'],
        defaultPeriod: '1m',
        category: 'technical',
    },
];
export function getAllDashboards(category) {
    if (category) {
        return PREDEFINED_DASHBOARDS.filter((d) => d.category === category);
    }
    return PREDEFINED_DASHBOARDS;
}
export function getDashboardById(dashboardId) {
    return PREDEFINED_DASHBOARDS.find((d) => d.id === dashboardId) || null;
}
export function createDashboard(name, widgets, createdBy) {
    const newDashboard = {
        id: `dash_custom_${Date.now()}`,
        name,
        description: `Custom dashboard created by ${createdBy}`,
        category: 'custom',
        widgets,
        createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false,
        tags: ['custom'],
    };
    return newDashboard;
}
export function getMetric(metricId, timeRange) {
    const definition = METRIC_DEFINITIONS[metricId];
    if (!definition) {
        throw new Error(`Unknown metric ID: ${metricId}`);
    }
    const baseValue = Math.random() * 100000;
    const value = Math.round(baseValue);
    const previousValue = Math.round(baseValue * (0.8 + Math.random() * 0.4));
    const change = ((value - previousValue) / previousValue) * 100;
    let trend = 'stable';
    if (change > 5)
        trend = 'up';
    else if (change < -5)
        trend = 'down';
    return {
        id: metricId,
        name: definition.name,
        category: definition.category,
        value,
        unit: definition.unit,
        change: Math.round(change * 10) / 10,
        trend,
        timestamp: new Date().toISOString(),
        previousValue,
    };
}
export function executeQuery(query, parameters) {
    const simulatedData = [];
    const rowCount = Math.floor(Math.random() * 50) + 10;
    for (let i = 0; i < rowCount; i++) {
        simulatedData.push({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.round(Math.random() * 1000),
            category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        });
    }
    return {
        query,
        executedAt: new Date().toISOString(),
        rowCount,
        data: simulatedData,
        executionTime: Math.round(Math.random() * 500) + 50,
        columns: ['date', 'value', 'category'],
    };
}
export function getReportTemplates() {
    return REPORT_TEMPLATES;
}
export function generateReport(reportType, dateRange) {
    const template = REPORT_TEMPLATES.find((t) => t.id === reportType || t.name === reportType);
    if (!template) {
        throw new Error(`Unknown report type: ${reportType}`);
    }
    return {
        reportId: `report_${Date.now()}`,
        template: template.name,
        dateRange,
        generatedAt: new Date().toISOString(),
        sections: template.sections.map((section) => ({
            title: section,
            content: `Sample content for ${section}`,
            metrics: ['revenue_mrr', 'users_mau'].map((id) => getMetric(id)),
        })),
        summary: `Report generated for period ${dateRange.start} to ${dateRange.end}`,
    };
}
export function getSampleDataset() {
    return {
        name: 'Sample Analytics Dataset',
        description: 'Sample data for testing queries and dashboards',
        records: 1000,
        schema: {
            userId: 'string',
            timestamp: 'datetime',
            action: 'string',
            value: 'number',
            metadata: 'object',
        },
        sampleRows: [
            {
                userId: 'user_001',
                timestamp: new Date().toISOString(),
                action: 'page_view',
                value: 1,
                metadata: { page: '/dashboard', duration: 120 },
            },
            {
                userId: 'user_002',
                timestamp: new Date().toISOString(),
                action: 'button_click',
                value: 1,
                metadata: { button: 'export', feature: 'reports' },
            },
        ],
    };
}
export function exportData(metricIds, format) {
    const metrics = metricIds.map((id) => getMetric(id));
    let data;
    let filename;
    switch (format) {
        case 'csv':
            const csvHeader = 'id,name,category,value,unit,change,trend,timestamp\n';
            const csvRows = metrics
                .map((m) => `${m.id},${m.name},${m.category},${m.value},${m.unit},${m.change},${m.trend},${m.timestamp}`)
                .join('\n');
            data = csvHeader + csvRows;
            filename = `metrics_export_${Date.now()}.csv`;
            break;
        case 'json':
            data = JSON.stringify(metrics, null, 2);
            filename = `metrics_export_${Date.now()}.json`;
            break;
        case 'xlsx':
            data = `[XLSX Binary Data - ${metrics.length} rows]`;
            filename = `metrics_export_${Date.now()}.xlsx`;
            break;
        default:
            throw new Error(`Unsupported export format: ${format}`);
    }
    return {
        format,
        filename,
        data,
        size: data.length,
        createdAt: new Date().toISOString(),
    };
}
export function listUsers() {
    const apiKeys = getAllApiKeys();
    return apiKeys.map((config) => ({
        apiKey: config.key,
        name: config.name,
        role: config.role,
        createdAt: '2025-01-01T00:00:00Z',
        lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        requestCount: Math.floor(Math.random() * 1000),
    }));
}
export function createUser(name, role) {
    return {
        apiKey: `mh_${role}_${Date.now()}`,
        name,
        role: role,
        createdAt: new Date().toISOString(),
        requestCount: 0,
    };
}
export function revokeUser(apiKey) {
    return {
        success: true,
        message: `API key ${apiKey} has been revoked`,
    };
}
export function getAvailableMetricIds() {
    return Object.keys(METRIC_DEFINITIONS);
}
//# sourceMappingURL=metrics-data.js.map