import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import {
  getCurrentWeather,
  getForecast,
  getWeatherAlerts,
  searchLocations,
  getAirQuality,
  getFavoriteLocations,
  getHistoricalWeather,
} from './weather-data.js';

const app = express();
// Don't use express.json() globally - SSE transport needs raw body
// app.use(express.json());

const server = new Server(
  {
    name: 'weatherflow-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

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
        const weather = getCurrentWeather(args.location as string);
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
        const days = (args.days as number) || 7;
        const forecast = getForecast(args.location as string, days);
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
        const alerts = getWeatherAlerts(args.location as string);
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
        const locations = searchLocations(args.query as string);
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
        const airQuality = getAirQuality(args.location as string);
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
  } catch (error) {
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
      const location = args?.location as string;
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
      const locations = (args?.locations as string).split(',').map(l => l.trim());
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
      const location = args?.location as string;
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

async function runServer() {
  const transport = process.argv.includes('--stdio')
    ? new StdioServerTransport()
    : null;

  if (transport) {
    console.error('WeatherFlow MCP Server running on stdio');
    await server.connect(transport);
  } else {
    const SSE_PORT = 3000;
    // Map sessionId to transport - will be populated when we see the endpoint event
    const transports = new Map<string, SSEServerTransport>();

    app.get('/sse', async (req, res) => {
      console.error(`\n=== SSE Connection ===`);
      console.error(`From: ${req.ip}`);

      const transport = new SSEServerTransport('/message', res);

      // Get the sessionId that will be generated
      const sessionId = (transport as any)._sessionId;
      console.error(`Session ID: ${sessionId}`);

      // Store transport by sessionId
      transports.set(sessionId, transport);

      // Connect to server - this will call transport.start()
      await server.connect(transport);

      req.on('close', () => {
        console.error(`SSE connection closed for session: ${sessionId}`);
        transports.delete(sessionId);
      });
    });

    // Don't parse JSON for /message endpoint - SSE transport does it
    app.post('/message', async (req, res) => {
      const sessionId = req.query.sessionId as string;
      console.error(`\n=== POST /message ===`);
      console.error(`SessionId: ${sessionId}`);
      console.error(`Content-Type: ${req.headers['content-type']}`);

      const transport = sessionId ? transports.get(sessionId) : null;

      if (!transport) {
        console.error(`❌ No transport found for session: ${sessionId}`);
        console.error(`Available sessions: ${Array.from(transports.keys()).join(', ')}`);
        res.status(400).json({ error: 'No active SSE connection' });
        return;
      }

      console.error(`✓ Transport found`);

      try {
        // Call handlePostMessage with req and res (transport will parse body)
        await transport.handlePostMessage(req, res);
        console.error(`✓ Message handled`);
      } catch (error) {
        console.error(`❌ Error:`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    });

    app.listen(SSE_PORT, () => {
      console.error(`WeatherFlow MCP Server (SSE) listening on http://localhost:${SSE_PORT}`);
      console.error(`SSE endpoint: http://localhost:${SSE_PORT}/sse`);
    });
  }
}

runServer().catch((error) => {
  console.error('Fatal error running server:', error);
  process.exit(1);
});
