import { NextRequest, NextResponse } from "next/server";
import { fetchDailyForecast } from "@/lib/weatherkit";
import type { WeatherResponse } from "@/lib/types";
import { format } from "date-fns";

// Cache weather data for 6 hours
const CACHE_DURATION = 6 * 60 * 60 * 1000;
const weatherCache = new Map<string, { data: WeatherResponse; timestamp: number }>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate) {
      return NextResponse.json(
        { error: "startDate parameter is required" },
        { status: 400 }
      );
    }

    // Validate that we're not requesting past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const requestedStart = new Date(startDate);
    requestedStart.setHours(0, 0, 0, 0);

    // If start date is before today, adjust it to today
    const adjustedStartDate = requestedStart < today
      ? format(today, "yyyy-MM-dd")
      : startDate;

    // Check cache
    const cacheKey = `${startDate}-${endDate || ""}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Fetch from WeatherKit
    const weatherData = await fetchDailyForecast(
      `${adjustedStartDate}T00:00:00Z`,
      endDate ? `${endDate}T23:59:59Z` : undefined
    );

    // Transform the response to our format
    const response: WeatherResponse = {};

    // Helper to convert Celsius to Fahrenheit
    const celsiusToFahrenheit = (celsius: number) => (celsius * 9/5) + 32;

    if (weatherData.forecastDaily?.days) {
      for (const day of weatherData.forecastDaily.days) {
        const date = format(new Date(day.forecastStart), "yyyy-MM-dd");
        response[date] = {
          date,
          temperatureMax: celsiusToFahrenheit(day.temperatureMax || 0),
          temperatureMin: celsiusToFahrenheit(day.temperatureMin || 0),
          conditionCode: day.conditionCode || "Clear",
          precipitationChance: day.precipitationChance || 0,
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
    console.error("Error fetching weather:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
