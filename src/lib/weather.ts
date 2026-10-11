export interface GeoLocation {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

export interface WeatherData {
  location: GeoLocation;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    isDay: boolean;
  };
  hourly: {
    time: string[];
    temperature: number[];
    humidity: number[];
  };
  daily: {
    time: string[];
    tempMax: number[];
    tempMin: number[];
    humidityAvg: number[];
    precipitation: number[];
  };
}

export async function searchLocations(query: string): Promise<GeoLocation[]> {
  if (!query.trim() || query.trim().length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query.trim()
  )}&count=8&language=en&format=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Location search failed');

  const data = await res.json();
  if (!data.results) return [];

  return data.results.map((r: any) => ({
    name: r.name,
    country: r.country || '',
    latitude: r.latitude,
    longitude: r.longitude,
    admin1: r.admin1,
  }));
}

export async function fetchWeatherForLocation(location: GeoLocation): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    'current': 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
    'hourly': 'temperature_2m,relative_humidity_2m',
    'daily': 'temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,precipitation_sum',
    'timezone': 'auto',
    'forecast_days': '7',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');

  const data = await res.json();

  return {
    location,
    current: {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
    hourly: {
      time: data.hourly.time,
      temperature: data.hourly.temperature_2m,
      humidity: data.hourly.relative_humidity_2m,
    },
    daily: {
      time: data.daily.time,
      tempMax: data.daily.temperature_2m_max,
      tempMin: data.daily.temperature_2m_min,
      humidityAvg: data.daily.relative_humidity_2m_mean,
      precipitation: data.daily.precipitation_sum,
    },
  };
}

export function weatherCodeToLabel(code: number): { label: string; icon: string } {
  const map: Record<number, { label: string; icon: string }> = {
    0: { label: 'Clear sky', icon: 'sun' },
    1: { label: 'Mainly clear', icon: 'sun' },
    2: { label: 'Partly cloudy', icon: 'cloud-sun' },
    3: { label: 'Overcast', icon: 'cloud' },
    45: { label: 'Fog', icon: 'cloud-fog' },
    48: { label: 'Rime fog', icon: 'cloud-fog' },
    51: { label: 'Light drizzle', icon: 'drizzle' },
    53: { label: 'Drizzle', icon: 'drizzle' },
    55: { label: 'Heavy drizzle', icon: 'drizzle' },
    61: { label: 'Light rain', icon: 'rain' },
    63: { label: 'Rain', icon: 'rain' },
    65: { label: 'Heavy rain', icon: 'rain' },
    66: { label: 'Freezing rain', icon: 'rain' },
    67: { label: 'Heavy freezing rain', icon: 'rain' },
    71: { label: 'Light snow', icon: 'snow' },
    73: { label: 'Snow', icon: 'snow' },
    75: { label: 'Heavy snow', icon: 'snow' },
    80: { label: 'Rain showers', icon: 'rain' },
    81: { label: 'Rain showers', icon: 'rain' },
    82: { label: 'Violent rain showers', icon: 'rain' },
    95: { label: 'Thunderstorm', icon: 'thunder' },
    96: { label: 'Thunderstorm w/ hail', icon: 'thunder' },
    99: { label: 'Severe thunderstorm', icon: 'thunder' },
  };

  return map[code] || { label: 'Unknown', icon: 'cloud' };
}

export function weatherCodeToLucideIcon(code: number): string {
  const { icon } = weatherCodeToLabel(code);
  return icon;
}
