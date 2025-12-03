import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { getCurrentWeather, getForecast, getWeatherAlerts, searchLocations, getAirQuality, getFavoriteLocations, getHistoricalWeather, } from './weather-data.js';
const app = express();
app.use(express.json());
const server = new Server({
    name: 'weatherflow-mcp-server-http',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
        resources: {},
        prompts: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'get_current_weather',
                description: 'Get current weather conditions for a location. Returns temperature, humidity, wind, conditions, and more.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'City name or location to get weather for (e.g., "New York", "London")',
                        },
                    },
                    required: ['location'],
                },
            },
            {
                name: 'get_forecast',
                description: 'Get weather forecast for upcoming days. Returns daily forecasts with high/low temps, conditions, and precipitation.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'City name or location to get forecast for',
                        },
                        days: {
                            type: 'number',
                            description: 'Number of days to forecast (3, 7, or 14)',
                            enum: [3, 7, 14],
                            default: 7,
                        },
                    },
                    required: ['location'],
                },
            },
            {
                name: 'get_weather_alerts',
                description: 'Get active severe weather alerts and warnings for a location. Returns storms, floods, heat advisories, etc.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'City name or location to check for alerts',
                        },
                    },
                    required: ['location'],
                },
            },
            {
                name: 'search_locations',
                description: 'Search for locations by city name or country. Returns matching locations with coordinates.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search query (city name or country)',
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'get_air_quality',
                description: 'Get current air quality index (AQI) and pollutant levels for a location.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'City name or location to get air quality for',
                        },
                    },
                    required: ['location'],
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        if (!args) {
            throw new Error('Missing arguments');
        }
        switch (name) {
            case 'get_current_weather': {
                const weather = getCurrentWeather(args.location);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(weather, null, 2),
                        },
                    ],
                };
            }
            case 'get_forecast': {
                const days = args.days || 7;
                const forecast = getForecast(args.location, days);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(forecast, null, 2),
                        },
                    ],
                };
            }
            case 'get_weather_alerts': {
                const alerts = getWeatherAlerts(args.location);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(alerts, null, 2),
                        },
                    ],
                };
            }
            case 'search_locations': {
                const locations = searchLocations(args.query);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(locations, null, 2),
                        },
                    ],
                };
            }
            case 'get_air_quality': {
                const airQuality = getAirQuality(args.location);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(airQuality, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${errorMessage}`,
                },
            ],
            isError: true,
        };
    }
});
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'weather://locations/favorites',
                name: 'Favorite Locations',
                description: 'Pre-configured list of popular cities worldwide',
                mimeType: 'application/json',
            },
            {
                uri: 'weather://historical/30days',
                name: 'Historical Weather (30 days)',
                description: 'Historical weather data for the past 30 days',
                mimeType: 'application/json',
            },
        ],
    };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    if (uri === 'weather://locations/favorites') {
        const locations = getFavoriteLocations();
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(locations, null, 2),
                },
            ],
        };
    }
    if (uri.startsWith('weather://historical/')) {
        const match = uri.match(/weather:\/\/historical\/(\w+)/);
        const location = match ? match[1] : 'New York';
        const historical = getHistoricalWeather(location, 30);
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(historical, null, 2),
                },
            ],
        };
    }
    throw new Error(`Unknown resource: ${uri}`);
});
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: 'plan_outdoor_activities',
                description: 'Get weather-based recommendations for planning outdoor activities',
                arguments: [
                    {
                        name: 'location',
                        description: 'Location to plan activities for',
                        required: true,
                    },
                    {
                        name: 'days',
                        description: 'Number of days to plan ahead (default: 3)',
                        required: false,
                    },
                ],
            },
            {
                name: 'travel_weather_brief',
                description: 'Get a comprehensive weather briefing for travel planning',
                arguments: [
                    {
                        name: 'locations',
                        description: 'Comma-separated list of locations to check',
                        required: true,
                    },
                ],
            },
            {
                name: 'severe_weather_report',
                description: 'Get detailed severe weather analysis and safety recommendations',
                arguments: [
                    {
                        name: 'location',
                        description: 'Location to check for severe weather',
                        required: true,
                    },
                ],
            },
        ],
    };
});
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'plan_outdoor_activities': {
            const location = args?.location;
            const days = typeof args?.days === 'number' ? args.days : 3;
            const forecast = getForecast(location, days);
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Based on this ${days}-day forecast for ${location}, suggest the best times for outdoor activities:\n\n${JSON.stringify(forecast, null, 2)}\n\nProvide specific recommendations for each day, considering temperature, precipitation, and wind conditions.`,
                        },
                    },
                ],
            };
        }
        case 'travel_weather_brief': {
            const locations = (args?.locations).split(',').map(l => l.trim());
            const briefing = locations.map(loc => ({
                location: loc,
                current: getCurrentWeather(loc),
                forecast: getForecast(loc, 3),
            }));
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Create a travel weather briefing for these locations:\n\n${JSON.stringify(briefing, null, 2)}\n\nSummarize the weather conditions, highlight any concerns, and provide packing recommendations.`,
                        },
                    },
                ],
            };
        }
        case 'severe_weather_report': {
            const location = args?.location;
            const alerts = getWeatherAlerts(location);
            const current = getCurrentWeather(location);
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Analyze this severe weather situation for ${location}:\n\nCurrent Conditions:\n${JSON.stringify(current, null, 2)}\n\nActive Alerts:\n${JSON.stringify(alerts, null, 2)}\n\nProvide a detailed analysis of the situation, potential impacts, and safety recommendations.`,
                        },
                    },
                ],
            };
        }
        default:
            throw new Error(`Unknown prompt: ${name}`);
    }
});
// Direct handler functions
async function handleToolsList() {
    return {
        tools: [
            {
                name: 'get_current_weather',
                description: 'Get current weather conditions for a location. Returns temperature, humidity, wind, conditions, and more.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'City name or location to get weather for (e.g., "New York", "London")',
                        },
                    },
                    required: ['location'],
                },
            },
            {
                name: 'get_forecast',
                description: 'Get weather forecast for upcoming days. Returns daily forecasts with high/low temps, conditions, and precipitation.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'City name or location to get forecast for',
                        },
                        days: {
                            type: 'number',
                            description: 'Number of days to forecast (3, 7, or 14)',
                            enum: [3, 7, 14],
                            default: 7,
                        },
                    },
                    required: ['location'],
                },
            },
            {
                name: 'get_weather_alerts',
                description: 'Get active severe weather alerts and warnings for a location. Returns storms, floods, heat advisories, etc.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'City name or location to check for alerts',
                        },
                    },
                    required: ['location'],
                },
            },
            {
                name: 'search_locations',
                description: 'Search for locations by city name or country. Returns matching locations with coordinates.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search query (city name or country)',
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'get_air_quality',
                description: 'Get current air quality index (AQI) and pollutant levels for a location.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'City name or location to get air quality for',
                        },
                    },
                    required: ['location'],
                },
            },
        ],
    };
}
async function handleToolCall(params) {
    const { name, arguments: args } = params;
    if (!args) {
        throw new Error('Missing arguments');
    }
    switch (name) {
        case 'get_current_weather': {
            const weather = getCurrentWeather(args.location);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(weather, null, 2),
                    },
                ],
            };
        }
        case 'get_forecast': {
            const days = args.days || 7;
            const forecast = getForecast(args.location, days);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(forecast, null, 2),
                    },
                ],
            };
        }
        case 'get_weather_alerts': {
            const alerts = getWeatherAlerts(args.location);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(alerts, null, 2),
                    },
                ],
            };
        }
        case 'search_locations': {
            const locations = searchLocations(args.query);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(locations, null, 2),
                    },
                ],
            };
        }
        case 'get_air_quality': {
            const airQuality = getAirQuality(args.location);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(airQuality, null, 2),
                    },
                ],
            };
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
async function handleResourcesList() {
    return {
        resources: [
            {
                uri: 'weather://locations/favorites',
                name: 'Favorite Locations',
                description: 'Pre-configured list of popular cities worldwide',
                mimeType: 'application/json',
            },
            {
                uri: 'weather://historical/30days',
                name: 'Historical Weather (30 days)',
                description: 'Historical weather data for the past 30 days',
                mimeType: 'application/json',
            },
        ],
    };
}
async function handleResourceRead(params) {
    const { uri } = params;
    if (uri === 'weather://locations/favorites') {
        const locations = getFavoriteLocations();
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(locations, null, 2),
                },
            ],
        };
    }
    if (uri.startsWith('weather://historical/')) {
        const match = uri.match(/weather:\/\/historical\/(\w+)/);
        const location = match ? match[1] : 'New York';
        const historical = getHistoricalWeather(location, 30);
        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(historical, null, 2),
                },
            ],
        };
    }
    throw new Error(`Unknown resource: ${uri}`);
}
app.post('/mcp', async (req, res) => {
    try {
        console.error('Received HTTP request:', JSON.stringify(req.body, null, 2));
        const request = req.body;
        // Handle notifications (no response needed)
        if (request.method && request.method.startsWith('notifications/')) {
            console.error('Received notification:', request.method);
            res.status(200).end();
            return;
        }
        let result;
        switch (request.method) {
            case 'initialize':
                result = {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {},
                        resources: {},
                        prompts: {},
                    },
                    serverInfo: {
                        name: 'weatherflow-mcp-server-http',
                        version: '1.0.0',
                    },
                };
                break;
            case 'tools/list':
                result = await handleToolsList();
                break;
            case 'tools/call':
                result = await handleToolCall(request.params);
                break;
            case 'resources/list':
                result = await handleResourcesList();
                break;
            case 'resources/read':
                result = await handleResourceRead(request.params);
                break;
            case 'ping':
                result = {};
                break;
            default:
                throw new Error(`Unknown method: ${request.method}`);
        }
        console.error('Sending response:', JSON.stringify(result, null, 2));
        res.json({
            jsonrpc: '2.0',
            result: result,
            id: request.id,
        });
    }
    catch (error) {
        console.error('Error handling request:', error);
        res.status(500).json({
            jsonrpc: '2.0',
            error: {
                code: -32603,
                message: error instanceof Error ? error.message : String(error),
            },
            id: req.body.id,
        });
    }
});
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', server: 'weatherflow-mcp-server-http' });
});
const HTTP_PORT = 3001;
app.listen(HTTP_PORT, () => {
    console.error(`WeatherFlow MCP Server (Streamable HTTP) listening on http://localhost:${HTTP_PORT}`);
    console.error(`HTTP endpoint: http://localhost:${HTTP_PORT}/mcp`);
    console.error(`Health check: http://localhost:${HTTP_PORT}/health`);
});
//# sourceMappingURL=streamable-http.js.map