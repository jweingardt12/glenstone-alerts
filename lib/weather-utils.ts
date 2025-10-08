/**
 * Client-safe weather utilities
 */

/**
 * Get weather icon emoji based on condition code
 */
export function getWeatherIcon(conditionCode: string): string {
  const iconMap: Record<string, string> = {
    Clear: "☀️",
    MostlyClear: "🌤️",
    PartlyCloudy: "⛅",
    MostlyCloudy: "🌥️",
    Cloudy: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    HeavyRain: "⛈️",
    Snow: "❄️",
    Sleet: "🌨️",
    Hail: "🧊",
    Thunderstorms: "⛈️",
    ScatteredThunderstorms: "🌩️",
    Windy: "💨",
    Breezy: "🍃",
    Foggy: "🌫️",
    Haze: "😶‍🌫️",
  };

  return iconMap[conditionCode] || "🌡️";
}
