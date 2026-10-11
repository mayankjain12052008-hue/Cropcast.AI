import type {
  Disease,
  WeatherReading,
  WeatherTrend,
  RiskAssessment,
  AdvisoryResult,
} from './types';

export async function fetchWeatherTrend(
  fieldLabel: string,
  supabase: import('@supabase/supabase-js').SupabaseClient
): Promise<WeatherTrend | null> {
  const { data, error } = await supabase
    .from('weather_readings')
    .select('*')
    .eq('field_label', fieldLabel)
    .order('recorded_at', { ascending: true })
    .limit(56);

  if (error || !data || data.length === 0) return null;

  const readings = data as WeatherReading[];
  const tempTrend = readings.map((r) => Number(r.temperature_c));
  const humidityTrend = readings.map((r) => Number(r.humidity_pct));
  const labels = readings.map((r) => {
    const d = new Date(r.recorded_at);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
  });
  const avgTemp = tempTrend.reduce((a, b) => a + b, 0) / tempTrend.length;
  const avgHumidity = humidityTrend.reduce((a, b) => a + b, 0) / humidityTrend.length;

  return {
    fieldLabel,
    avgTemp: Number(avgTemp.toFixed(1)),
    avgHumidity: Number(avgHumidity.toFixed(1)),
    tempTrend,
    humidityTrend,
    labels,
    latestTemp: tempTrend[tempTrend.length - 1],
    latestHumidity: humidityTrend[humidityTrend.length - 1],
  };
}

export function assessSecondaryInfectionRisk(
  disease: Disease,
  weather: WeatherTrend
): RiskAssessment {
  const avgTemp = weather.avgTemp;
  const avgHumidity = weather.avgHumidity;

  const tempInRange = avgTemp >= disease.temp_min_c && avgTemp <= disease.temp_max_c;
  const humidityInRange =
    avgHumidity >= disease.humidity_min && avgHumidity <= disease.humidity_max;

  const tempDistance = Math.min(
    Math.abs(avgTemp - disease.temp_min_c),
    Math.abs(avgTemp - disease.temp_max_c)
  );
  const humidityDistance = Math.min(
    Math.abs(avgHumidity - disease.humidity_min),
    Math.abs(avgHumidity - disease.humidity_max)
  );

  let riskScore = 0;

  if (tempInRange) {
    riskScore += 0.35;
  } else if (tempDistance < 3) {
    riskScore += 0.2;
  } else if (tempDistance < 5) {
    riskScore += 0.08;
  }

  if (humidityInRange) {
    riskScore += 0.4;
  } else if (humidityDistance < 5) {
    riskScore += 0.22;
  } else if (humidityDistance < 10) {
    riskScore += 0.1;
  }

  const severityWeight =
    disease.severity === 'severe'
      ? 0.2
      : disease.severity === 'moderate'
        ? 0.12
        : 0.05;
  riskScore += severityWeight;

  const pathogenBonus = disease.pathogen_type === 'oomycete' ? 0.05 : 0;
  riskScore += pathogenBonus;

  const humidityRising =
    weather.humidityTrend.length >= 2 &&
    weather.humidityTrend[weather.humidityTrend.length - 1] >
      weather.humidityTrend[weather.humidityTrend.length - 4 < 0 ? 0 : weather.humidityTrend.length - 4];
  if (humidityRising) riskScore += 0.03;

  riskScore = Math.min(riskScore, 0.98);

  let riskLevel: RiskAssessment['riskLevel'];
  if (riskScore < 0.25) riskLevel = 'low';
  else if (riskScore < 0.5) riskLevel = 'moderate';
  else if (riskScore < 0.75) riskLevel = 'high';
  else riskLevel = 'critical';

  const tempDesc = tempInRange ? 'within optimal range' : `${tempDistance.toFixed(0)}°C outside range`;
  const humidityDesc = humidityInRange
    ? 'within optimal range'
    : `${humidityDistance.toFixed(0)}% outside range`;

  const weatherContext = `Avg temp ${avgTemp.toFixed(1)}°C (${tempDesc}), avg humidity ${avgHumidity.toFixed(1)}% (${humidityDesc}) for ${disease.name}.`;

  let optimalWindow: string;
  if (riskScore >= 0.6) {
    optimalWindow = 'Immediate action required — spray within 24-48 hours before conditions worsen';
  } else if (riskScore >= 0.35) {
    optimalWindow = 'Treat within 3-5 days, monitor closely for condition changes';
  } else if (riskScore >= 0.2) {
    optimalWindow = 'Preventive treatment recommended within 7 days';
  } else {
    optimalWindow = 'No immediate action needed — monitor weekly and re-scan if symptoms spread';
  }

  return {
    secondaryInfectionRisk: Number(riskScore.toFixed(2)),
    riskLevel,
    weatherContext,
    optimalWindow,
  };
}

export function calibrateConfidence(
  baseConfidence: number,
  risk: RiskAssessment,
  severity: string
): number {
  let calibrated = baseConfidence;

  const severityFactor =
    severity === 'severe'
      ? 0.03
      : severity === 'moderate'
        ? 0.0
        : -0.02;
  calibrated += severityFactor;

  if (risk.riskLevel === 'high') calibrated += 0.02;
  if (risk.riskLevel === 'critical') calibrated += 0.04;
  if (risk.riskLevel === 'low') calibrated -= 0.03;

  calibrated = Math.max(0.45, Math.min(calibrated, 0.97));

  return Number(calibrated.toFixed(2));
}

export function generateAdvisory(
  disease: Disease,
  weather: WeatherTrend,
  confidence: number
): AdvisoryResult {
  const risk = assessSecondaryInfectionRisk(disease, weather);
  const calibratedConfidence = calibrateConfidence(confidence, risk, disease.severity);

  const sprayRecommended = risk.secondaryInfectionRisk >= 0.3 && calibratedConfidence >= 0.55;

  let sprayUrgency: AdvisoryResult['sprayUrgency'];
  if (risk.secondaryInfectionRisk >= 0.7) sprayUrgency = 'critical';
  else if (risk.secondaryInfectionRisk >= 0.5) sprayUrgency = 'high';
  else if (risk.secondaryInfectionRisk >= 0.3) sprayUrgency = 'moderate';
  else sprayUrgency = 'low';

  let recommendation: string;
  if (sprayRecommended) {
    recommendation = `Immediate treatment recommended for ${disease.name}. ${risk.optimalWindow}. Use ${disease.treatment || 'appropriate fungicide'} as primary intervention. Confidence is ${calibratedConfidence > 0.8 ? 'high' : 'moderate'} — secondary infection risk is ${risk.riskLevel}.`;
  } else if (risk.secondaryInfectionRisk >= 0.2) {
    recommendation = `Preventive measures advised for ${disease.name}. Conditions are approaching disease-favorable range. Monitor weather trends and prepare treatment plan. No spray needed at current confidence level (${calibratedConfidence}).`;
  } else {
    recommendation = `No spray recommended at this time. ${disease.name} identified but current weather conditions (${weather.avgTemp.toFixed(1)}°C, ${weather.avgHumidity.toFixed(1)}% humidity) are not favorable for secondary infection spread. Continue monitoring and re-scan in 5-7 days.`;
  }

  return {
    recommendation,
    sprayRecommended,
    sprayUrgency,
    secondaryInfectionRisk: risk.secondaryInfectionRisk,
    riskLevel: risk.riskLevel,
    confidenceCalibrated: calibratedConfidence,
    optimalWindow: risk.optimalWindow,
    weatherContext: risk.weatherContext,
    treatmentDetails: disease.treatment || 'Consult local agricultural extension for treatment options.',
  };
}

export function simulateDiseaseMatch(
  diseases: Disease[],
  imageData: { brightness: number; greenness: number; brownness: number; spotCount: number }
): { disease: Disease; rawConfidence: number; severity: string } | null {
  if (diseases.length === 0) return null;

  const scored = diseases.map((d) => {
    let score = d.base_confidence;

    const isFungal = d.pathogen_type === 'fungal' || d.pathogen_type === 'oomycete';
    if (isFungal && imageData.brownness > 0.3) score += 0.08;
    if (isFungal && imageData.spotCount > 5) score += 0.06;
    if (imageData.greenness > 0.6 && imageData.brownness < 0.2) score -= 0.1;
    if (imageData.brightness < 0.3) score += 0.03;
    if (d.pathogen_type === 'oomycete' && imageData.brownness > 0.25) score += 0.05;

    score += (Math.random() - 0.5) * 0.06;
    score = Math.max(0.3, Math.min(score, 0.95));

    return { disease: d, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  const severity =
    best.score > 0.8
      ? 'severe'
      : best.score > 0.65
        ? 'moderate'
        : 'low';

  return {
    disease: best.disease,
    rawConfidence: Number(best.score.toFixed(2)),
    severity,
  };
}

export function analyzeImageFeatures(file: File): Promise<{
  brightness: number;
  greenness: number;
  brownness: number;
  spotCount: number;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ brightness: 0.5, greenness: 0.4, brownness: 0.2, spotCount: 3 });
        return;
      }

      const maxSize = 200;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      let totalBrightness = 0;
      let greenPixels = 0;
      let brownPixels = 0;
      let darkSpotPixels = 0;
      const totalPixels = pixels.length / 4;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;

        if (g > r && g > b && g > 60) greenPixels++;
        if (r > 60 && g > 30 && g < r && b < r * 0.7) brownPixels++;
        if (brightness < 50) darkSpotPixels++;
      }

      resolve({
        brightness: Number((totalBrightness / totalPixels / 255).toFixed(2)),
        greenness: Number((greenPixels / totalPixels).toFixed(2)),
        brownness: Number((brownPixels / totalPixels).toFixed(2)),
        spotCount: Math.round((darkSpotPixels / totalPixels) * 100),
      });
    };

    img.onerror = () => {
      resolve({ brightness: 0.5, greenness: 0.4, brownness: 0.2, spotCount: 3 });
    };

    reader.readAsDataURL(file);
  });
}
