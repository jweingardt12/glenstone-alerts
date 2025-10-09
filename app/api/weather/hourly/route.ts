import { NextRequest, NextResponse } from "next/server";
import { fetchHourlyForecast } from "@/lib/weatherkit";
import type { HourlyWeatherResponse } from "@/lib/types";
import { parseISO, getHours } from "date-fns";

// Cache weather data for 6 hours
const CACHE_DURATION = 6 * 60 * 60 * 1000;
const weatherCache = new Map<string, { data: HourlyWeatherResponse; timestamp: number }>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "date parameter is required (YYYY-MM-DD format)" },
        { status: 400 }
      );
    }

    // Don't fetch weather for past dates
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    requestedDate.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return NextResponse.json({}, { status: 200 }); // Return empty object for past dates
    }

    // Check cache
    const cacheKey = date;
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Fetch from WeatherKit
    const weatherData = await fetchHourlyForecast(date);

    // Transform the response to our format
    const response: HourlyWeatherResponse = {};

    // Helper to convert Celsius to Fahrenheit
    const celsiusToFahrenheit = (celsius: number) => (celsius * 9/5) + 32;

    if (weatherData.forecastHourly?.hours) {
      for (const hour of weatherData.forecastHourly.hours) {
        const hourDate = parseISO(hour.forecastStart);
        const hourKey = getHours(hourDate).toString();

        response[hourKey] = {
          hour: hour.forecastStart,
          temperature: Math.round(celsiusToFahrenheit(hour.temperature)),
          conditionCode: hour.conditionCode || "Clear",
          precipitationChance: hour.precipitationChance || 0,
        };
      }
    }

    // Cache the result
    weatherCache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching hourly weather:", error);
    return NextResponse.json(
      { error: "Failed to fetch hourly weather data" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
