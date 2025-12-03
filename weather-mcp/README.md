# WeatherFlow MCP Server

WeatherFlow is a Model Context Protocol (MCP) server that provides real-time weather data, forecasts, and severe weather alerts. It demonstrates MCP implementation with both **SSE (Server-Sent Events)** and **Streamable HTTP** transports, with **no authentication** required.

## Features

### Tools

- **get_current_weather** - Get current weather conditions including temperature, humidity, wind, and more
- **get_forecast** - Get weather forecasts for 3, 7, or 14 days ahead
- **get_weather_alerts** - Check for active severe weather warnings and advisories
- **search_locations** - Find locations by city name or country
- **get_air_quality** - Get current air quality index (AQI) and pollutant levels

### Resources

- `weather://locations/favorites` - Pre-configured list of popular cities worldwide
- `weather://historical/30days` - Historical weather data for the past 30 days

### Prompts

- **plan_outdoor_activities** - Get weather-based recommendations for outdoor planning
- **travel_weather_brief** - Comprehensive weather briefing for multiple locations
- **severe_weather_report** - Detailed severe weather analysis and safety recommendations

## Installation

```bash
cd weather-mcp
npm install
npm run build
```

## Usage

### SSE Transport (Port 3000)

Start the server with SSE transport:

```bash
npm run dev
```

The SSE endpoint will be available at:
- **Endpoint**: `http://localhost:3000/sse`
- **Message POST**: `http://localhost:3000/message`

### Streamable HTTP Transport (Port 3001)

Start the HTTP transport server:

```bash
node dist/streamable-http.js
```

The HTTP endpoint will be available at:
- **Endpoint**: `http://localhost:3001/mcp`
- **Health Check**: `http://localhost:3001/health`

### Stdio Transport

For testing with stdio transport:

```bash
node dist/index.js --stdio
```

## Example Requests

### Get Current Weather

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_current_weather",
    "arguments": {
      "location": "New York"
    }
  }
}
```

### Get 7-Day Forecast

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_forecast",
    "arguments": {
      "location": "London",
      "days": 7
    }
  }
}
```

### Check Weather Alerts

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_weather_alerts",
    "arguments": {
      "location": "Tokyo"
    }
  }
}
```

### Search Locations

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "search_locations",
    "arguments": {
      "query": "Paris"
    }
  }
}
```

### Get Air Quality

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_air_quality",
    "arguments": {
      "location": "Singapore"
    }
  }
}
```

## Configuration

### MCP Client Configuration

Add to your MCP client configuration:

#### SSE Transport
```json
{
  "mcpServers": {
    "weatherflow": {
      "url": "http://localhost:3000/sse",
      "transport": "sse"
    }
  }
}
```

#### HTTP Transport
```json
{
  "mcpServers": {
    "weatherflow": {
      "url": "http://localhost:3001/mcp",
      "transport": "http"
    }
  }
}
```

## Sample Data

WeatherFlow uses mock data to simulate realistic weather conditions. The data includes:

- **8 major cities**: New York, London, Tokyo, Paris, Sydney, Dubai, Singapore, Los Angeles
- **7 weather conditions**: Clear, Partly Cloudy, Cloudy, Rainy, Stormy, Snowy, Foggy
- **5 alert types**: Thunderstorm Warning, Heat Advisory, Winter Storm Watch, Flood Warning, High Wind Warning
- **Air quality levels**: Good, Moderate, Unhealthy for Sensitive Groups, Unhealthy

## Authentication

This server requires **no authentication** and is designed for open public access. It's ideal for:
- Development and testing
- Public weather dashboards
- Educational purposes
- Open data applications

## Transport Comparison

| Feature | SSE | Streamable HTTP |
|---------|-----|-----------------|
| Port | 3000 | 3001 |
| Connection | Persistent | Request/Response |
| Real-time Updates | Yes | No |
| Firewall Friendly | Moderate | High |
| Complexity | Medium | Low |

## Architecture

```
weather-mcp/
├── src/
│   ├── index.ts              # Main SSE server
│   ├── streamable-http.ts    # HTTP transport server
│   └── weather-data.ts       # Mock data generator
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

### Clean Build
```bash
rm -rf dist && npm run build
```

## Future Enhancements

Potential additions for future versions:
- Real weather API integration (OpenWeatherMap, Weather.gov)
- WebSocket transport support
- Rate limiting
- Caching layer
- More detailed forecast data
- Radar and satellite imagery
- Marine and aviation weather
- Climate data and trends

## License

MIT

## Contributing

Contributions welcome! This is a sample MCP server demonstrating no-auth implementations.
