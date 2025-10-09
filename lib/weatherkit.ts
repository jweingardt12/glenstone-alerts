import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// Glenstone Museum coordinates
const GLENSTONE_LAT = 39.064;
const GLENSTONE_LON = -77.256;

// Token cache (tokens are valid for 1 hour)
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Generate a JWT token for WeatherKit API authentication
 */
export function generateWeatherKitToken(): string {
  // Return cached token if still valid
  const now = Date.now() / 1000;
  if (cachedToken && tokenExpiry > now + 60) {
    // Token still valid for at least 1 more minute
    return cachedToken;
  }

  const teamId = process.env.WEATHERKIT_TEAM_ID;
  const keyId = process.env.WEATHERKIT_KEY_ID;
  const serviceId = process.env.WEATHERKIT_SERVICE_ID;
  const keyPath = process.env.WEATHERKIT_PRIVATE_KEY_PATH;
  let privateKey = process.env.WEATHERKIT_PRIVATE_KEY; // preferred for Vercel

  if (!privateKey) {
    // Fallback to file path for local/dev usage
    if (!keyPath) {
      throw new Error(
        "Missing WeatherKit private key. Provide WEATHERKIT_PRIVATE_KEY (preferred) or WEATHERKIT_PRIVATE_KEY_PATH."
      );
    }
    const privateKeyPath = path.isAbsolute(keyPath)
      ? keyPath
      : path.join(process.cwd(), keyPath);
    privateKey = fs.readFileSync(privateKeyPath, "utf8");
  }

  // Allow base64-encoded key (handy for environment variables)
  if (privateKey && !privateKey.includes("BEGIN")) {
    try {
      privateKey = Buffer.from(privateKey, "base64").toString("utf8");
    } catch {
      // ignore; will fail later if invalid
    }
  }

  // Support escaped newlines in env vars (e.g., Vercel)
  if (privateKey && privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  if (!teamId || !keyId || !serviceId || !privateKey) {
    throw new Error("Missing WeatherKit environment variables");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600; // 1 hour from now

  // Create JWT token
  const signingKey = privateKey as string;

  const token = jwt.sign(
    {
      iss: teamId,
      iat: issuedAt,
      exp: expiresAt,
      sub: serviceId,
    },
    signingKey,
    {
      algorithm: "ES256",
      keyid: keyId,
      header: {
        alg: "ES256",
        typ: "JWT",
        kid: keyId,
      },
    }
  );

  // Cache the token
  cachedToken = token;
  tokenExpiry = expiresAt;

  return token;
}

export interface DailyWeatherForecast {
  forecastDaily?: {
    days: Array<{
      forecastStart: string;
      forecastEnd: string;
      conditionCode: string;
      maxUvIndex: number;
      moonPhase: string;
      moonrise: string;
      moonset: string;
      precipitationAmount: number;
      precipitationChance: number;
      precipitationType: string;
      snowfallAmount: number;
      solarMidnight: string;
      solarNoon: string;
      sunrise: string;
      sunset: string;
      temperatureMax: number;
      temperatureMin: number;
      daytimeForecast?: {
        cloudCover: number;
        conditionCode: string;
        humidity: number;
        precipitationAmount: number;
        precipitationChance: number;
        precipitationType: string;
        snowfallAmount: number;
        windDirection: number;
        windSpeed: number;
      };
      overnightForecast?: {
        cloudCover: number;
        conditionCode: string;
        humidity: number;
        precipitationAmount: number;
        precipitationChance: number;
        precipitationType: string;
        snowfallAmount: number;
        windDirection: number;
        windSpeed: number;
      };
    }>;
  };
}

/**
 * Fetch daily weather forecast from WeatherKit
 */
export async function fetchDailyForecast(
  startDate: string,
  endDate?: string
): Promise<DailyWeatherForecast> {
  const token = generateWeatherKitToken();

  // Build URL with parameters
  const params = new URLSearchParams({
    dataSets: "forecastDaily",
    timezone: "America/New_York",
    dailyStart: startDate,
  });

  if (endDate) {
    params.append("dailyEnd", endDate);
  }

  const url = `https://weatherkit.apple.com/api/v1/weather/en/${GLENSTONE_LAT}/${GLENSTONE_LON}?${params}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("WeatherKit API error:", response.status, errorText);
    throw new Error(`WeatherKit API error: ${response.status}`);
  }

  return response.json();
}
