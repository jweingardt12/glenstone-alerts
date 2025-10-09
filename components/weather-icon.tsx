import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Wind,
  Snowflake,
  type LucideIcon,
} from "lucide-react";

interface WeatherIconProps {
  conditionCode: string;
  className?: string;
}

const getWeatherIcon = (conditionCode: string): LucideIcon => {
  // Map Apple WeatherKit condition codes to icons
  switch (conditionCode) {
    case "Clear":
      return Sun;
    case "MostlyClear":
    case "PartlyCloudy":
      return Sun;
    case "Cloudy":
    case "MostlyCloudy":
      return Cloud;
    case "Rain":
    case "HeavyRain":
    case "FreezingRain":
      return CloudRain;
    case "Drizzle":
    case "ScatteredShowers":
      return CloudDrizzle;
    case "Snow":
    case "HeavySnow":
    case "Flurries":
    case "Blizzard":
    case "BlowingSnow":
      return CloudSnow;
    case "Sleet":
    case "FreezingDrizzle":
    case "WintryMix":
      return Snowflake;
    case "Thunderstorms":
    case "ScatteredThunderstorms":
    case "IsolatedThunderstorms":
      return CloudLightning;
    case "Foggy":
    case "Haze":
    case "Smoky":
      return CloudFog;
    case "Breezy":
    case "Windy":
      return Wind;
    default:
      return Sun; // Default fallback
  }
};

export function WeatherIcon({ conditionCode, className = "h-4 w-4" }: WeatherIconProps) {
  const Icon = getWeatherIcon(conditionCode);
  return <Icon className={className} />;
}
