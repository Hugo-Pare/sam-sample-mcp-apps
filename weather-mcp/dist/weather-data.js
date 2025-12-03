const FAVORITE_LOCATIONS = [
    { city: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060, timezone: 'America/New_York' },
    { city: 'London', country: 'UK', lat: 51.5074, lon: -0.1278, timezone: 'Europe/London' },
    { city: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo' },
    { city: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, timezone: 'Europe/Paris' },
    { city: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, timezone: 'Australia/Sydney' },
    { city: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708, timezone: 'Asia/Dubai' },
    { city: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, timezone: 'Asia/Singapore' },
    { city: 'Los Angeles', country: 'USA', lat: 34.0522, lon: -118.2437, timezone: 'America/Los_Angeles' },
];
const CONDITIONS = [
    { name: 'Clear', description: 'Clear sky' },
    { name: 'Partly Cloudy', description: 'Partly cloudy with sunny intervals' },
    { name: 'Cloudy', description: 'Overcast with thick clouds' },
    { name: 'Rainy', description: 'Light to moderate rain' },
    { name: 'Stormy', description: 'Thunderstorms with heavy rain' },
    { name: 'Snowy', description: 'Snow showers' },
    { name: 'Foggy', description: 'Dense fog reducing visibility' },
];
export function searchLocations(query) {
    const lowerQuery = query.toLowerCase();
    return FAVORITE_LOCATIONS.filter(loc => loc.city.toLowerCase().includes(lowerQuery) ||
        loc.country.toLowerCase().includes(lowerQuery));
}
export function getCurrentWeather(location) {
    const loc = searchLocations(location)[0] || FAVORITE_LOCATIONS[0];
    const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
    return {
        location: loc,
        timestamp: new Date().toISOString(),
        temperature: Math.round(15 + Math.random() * 20),
        feels_like: Math.round(14 + Math.random() * 20),
        humidity: Math.round(40 + Math.random() * 40),
        pressure: Math.round(1000 + Math.random() * 30),
        wind_speed: Math.round(Math.random() * 30),
        wind_direction: Math.round(Math.random() * 360),
        conditions: condition.name,
        description: condition.description,
        visibility: Math.round(5 + Math.random() * 10),
        uv_index: Math.round(Math.random() * 11),
    };
}
export function getForecast(location, days = 7) {
    const forecast = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
        forecast.push({
            date: date.toISOString().split('T')[0],
            temp_high: Math.round(18 + Math.random() * 18),
            temp_low: Math.round(8 + Math.random() * 12),
            conditions: condition.name,
            description: condition.description,
            precipitation_chance: Math.round(Math.random() * 100),
            wind_speed: Math.round(Math.random() * 25),
            humidity: Math.round(40 + Math.random() * 40),
        });
    }
    return forecast;
}
export function getWeatherAlerts(location) {
    const alerts = [];
    if (Math.random() > 0.7) {
        const loc = searchLocations(location)[0] || FAVORITE_LOCATIONS[0];
        const now = new Date();
        const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const alertTypes = [
            { event: 'Thunderstorm Warning', severity: 'severe', headline: 'Severe thunderstorms expected' },
            { event: 'Heat Advisory', severity: 'moderate', headline: 'Excessive heat expected' },
            { event: 'Winter Storm Watch', severity: 'severe', headline: 'Heavy snow possible' },
            { event: 'Flood Warning', severity: 'extreme', headline: 'Flooding imminent' },
            { event: 'High Wind Warning', severity: 'moderate', headline: 'Damaging winds expected' },
        ];
        const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        alerts.push({
            id: `ALERT-${Date.now()}`,
            severity: alert.severity,
            event: alert.event,
            headline: alert.headline,
            description: `The National Weather Service has issued a ${alert.event} for ${loc.city} and surrounding areas. Residents should take appropriate precautions.`,
            areas: [loc.city, `${loc.city} Metro Area`],
            start: now.toISOString(),
            end: end.toISOString(),
        });
    }
    return alerts;
}
export function getAirQuality(location) {
    const loc = searchLocations(location)[0] || FAVORITE_LOCATIONS[0];
    const aqi = Math.round(20 + Math.random() * 120);
    let category;
    if (aqi <= 50)
        category = 'Good';
    else if (aqi <= 100)
        category = 'Moderate';
    else if (aqi <= 150)
        category = 'Unhealthy for Sensitive Groups';
    else
        category = 'Unhealthy';
    return {
        location: loc,
        timestamp: new Date().toISOString(),
        aqi,
        category,
        pollutants: {
            pm25: Math.round(5 + Math.random() * 30),
            pm10: Math.round(10 + Math.random() * 50),
            o3: Math.round(20 + Math.random() * 60),
            no2: Math.round(10 + Math.random() * 40),
            co: Math.round(100 + Math.random() * 300),
        },
    };
}
export function getFavoriteLocations() {
    return FAVORITE_LOCATIONS;
}
export function getHistoricalWeather(location, daysBack = 30) {
    const historical = [];
    const today = new Date();
    for (let i = daysBack; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        historical.push({
            date: date.toISOString().split('T')[0],
            temp_high: Math.round(15 + Math.random() * 20),
            temp_low: Math.round(5 + Math.random() * 15),
            precipitation: Math.round(Math.random() * 50) / 10,
            conditions: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)].name,
        });
    }
    return historical;
}
//# sourceMappingURL=weather-data.js.map