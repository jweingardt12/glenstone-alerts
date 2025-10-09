import { NextResponse } from "next/server";
import { fetchCurrentWeather } from "@/lib/weatherkit";
import type { CurrentWeather } from "@/lib/types";

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

let cachedWeather: { data: CurrentWeather; timestamp: number } | null = null;

const celsiusToFahrenheit = (celsius: number) => (celsius * 9) / 5 + 32;

export async function GET() {
  try {
    if (cachedWeather && Date.now() - cachedWeather.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedWeather.data);
    }

    const payload = await fetchCurrentWeather();
    const current = payload.currentWeather;

    if (!current) {
      throw new Error("Missing current weather data");
    }

    const response: CurrentWeather = {
      temperature: celsiusToFahrenheit(current.temperature ?? 0),
      feelsLike: celsiusToFahrenheit(
        current.temperatureApparent ?? current.temperature ?? 0
      ),
      conditionCode: current.conditionCode ?? "Clear",
      humidity: current.humidity ?? 0,
      windSpeed: current.windSpeed ?? 0,
      observationTime: current.asOf ?? new Date().toISOString(),
    };

    cachedWeather = {
      data: response,
      timestamp: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching current weather:", error);
    return NextResponse.json(
      { error: "Failed to fetch current weather" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
