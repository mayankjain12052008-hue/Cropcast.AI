import type { WeatherData } from './weather';

export type AlertSeverity = 'warning' | 'danger';

export interface WeatherAlert {
  key: string;
  severity: AlertSeverity;
  titleKey: string;
  messageKey: string;
  icon: string;
}

export function detectWeatherAlerts(data: WeatherData): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const { current, daily } = data;

  // Frost warning: any day with min temp below 5°C
  const frostDay = daily.tempMin.findIndex((t) => t < 5);
  if (frostDay !== -1) {
    alerts.push({
      key: 'frost',
      severity: 'danger',
      titleKey: 'alert.frostTitle',
      messageKey: 'alert.frostMsg',
      icon: 'Snowflake',
    });
  }

  // Extreme heat: any day with max temp above 40°C
  const heatDay = daily.tempMax.findIndex((t) => t > 40);
  if (heatDay !== -1) {
    alerts.push({
      key: 'heat',
      severity: 'danger',
      titleKey: 'alert.heatTitle',
      messageKey: 'alert.heatMsg',
      icon: 'Thermometer',
    });
  }

  // Heavy rain: any day with precipitation > 10mm
  const heavyRainDay = daily.precipitation.findIndex((p) => p > 10);
  if (heavyRainDay !== -1) {
    alerts.push({
      key: 'heavyRain',
      severity: 'warning',
      titleKey: 'alert.heavyRainTitle',
      messageKey: 'alert.heavyRainMsg',
      icon: 'CloudRain',
    });
  }

  // Continuous rain: 3+ consecutive days with precipitation
  let consecutiveRain = 0;
  let maxConsecutive = 0;
  for (const p of daily.precipitation) {
    if (p > 0.5) {
      consecutiveRain++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveRain);
    } else {
      consecutiveRain = 0;
    }
  }
  if (maxConsecutive >= 3) {
    alerts.push({
      key: 'continuousRain',
      severity: 'warning',
      titleKey: 'alert.continuousRainTitle',
      messageKey: 'alert.continuousRainMsg',
      icon: 'CloudDrizzle',
    });
  }

  // High humidity: average humidity above 85%
  const avgHumidity = daily.humidityAvg.reduce((a, b) => a + b, 0) / daily.humidityAvg.length;
  if (avgHumidity > 85) {
    alerts.push({
      key: 'highHumidity',
      severity: 'warning',
      titleKey: 'alert.highHumidityTitle',
      messageKey: 'alert.highHumidityMsg',
      icon: 'Droplets',
    });
  }

  // Strong wind: current wind speed above 30 km/h
  if (current.windSpeed > 30) {
    alerts.push({
      key: 'strongWind',
      severity: 'warning',
      titleKey: 'alert.strongWindTitle',
      messageKey: 'alert.strongWindMsg',
      icon: 'Wind',
    });
  }

  // Sudden temperature drop: max temp drops >10°C from one day to the next
  for (let i = 1; i < daily.tempMax.length; i++) {
    if (daily.tempMax[i - 1] - daily.tempMax[i] > 10) {
      alerts.push({
        key: 'tempDrop',
        severity: 'warning',
        titleKey: 'alert.tempDropTitle',
        messageKey: 'alert.tempDropMsg',
        icon: 'TrendingDown',
      });
      break;
    }
  }

  // Sudden temperature rise: max temp rises >10°C from one day to the next
  for (let i = 1; i < daily.tempMax.length; i++) {
    if (daily.tempMax[i] - daily.tempMax[i - 1] > 10) {
      alerts.push({
        key: 'tempRise',
        severity: 'warning',
        titleKey: 'alert.tempRiseTitle',
        messageKey: 'alert.tempRiseMsg',
        icon: 'TrendingUp',
      });
      break;
    }
  }

  // Large daily temperature swing: >15°C between max and min
  const swingDay = daily.time.findIndex((_, i) => daily.tempMax[i] - daily.tempMin[i] > 15);
  if (swingDay !== -1) {
    alerts.push({
      key: 'tempSwing',
      severity: 'warning',
      titleKey: 'alert.tempSwingTitle',
      messageKey: 'alert.tempSwingMsg',
      icon: 'Gauge',
    });
  }

  // Thunderstorm in forecast
  if (current.weatherCode >= 95) {
    alerts.push({
      key: 'thunderstorm',
      severity: 'danger',
      titleKey: 'alert.thunderstormTitle',
      messageKey: 'alert.thunderstormMsg',
      icon: 'Zap',
    });
  }

  return alerts;
}
