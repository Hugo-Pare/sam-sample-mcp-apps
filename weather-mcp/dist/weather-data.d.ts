export interface Location {
    city: string;
    country: string;
    lat: number;
    lon: number;
    timezone: string;
}
export interface CurrentWeather {
    location: Location;
    timestamp: string;
    temperature: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    wind_speed: number;
    wind_direction: number;
    conditions: string;
    description: string;
    visibility: number;
    uv_index: number;
}
export interface ForecastDay {
    date: string;
    temp_high: number;
    temp_low: number;
    conditions: string;
    description: string;
    precipitation_chance: number;
    wind_speed: number;
    humidity: number;
}
export interface WeatherAlert {
    id: string;
    severity: 'minor' | 'moderate' | 'severe' | 'extreme';
    event: string;
    headline: string;
    description: string;
    areas: string[];
    start: string;
    end: string;
}
export interface AirQuality {
    location: Location;
    timestamp: string;
    aqi: number;
    category: string;
    pollutants: {
        pm25: number;
        pm10: number;
        o3: number;
        no2: number;
        co: number;
    };
}
export declare function searchLocations(query: string): Location[];
export declare function getCurrentWeather(location: string): CurrentWeather;
export declare function getForecast(location: string, days?: number): ForecastDay[];
export declare function getWeatherAlerts(location: string): WeatherAlert[];
export declare function getAirQuality(location: string): AirQuality;
export declare function getFavoriteLocations(): Location[];
export declare function getHistoricalWeather(location: string, daysBack?: number): any[];
//# sourceMappingURL=weather-data.d.ts.map