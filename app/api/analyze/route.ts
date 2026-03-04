import { NextResponse } from "next/server";
import { scrapeMovieData } from "../../../lib/imdb";
import { analyzeSentiment } from "../../../lib/gemini";

// Simple in-memory cache to prevent repeated API/Scraping calls
const analysisCache = new Map<string, any>();

export async function POST(req: Request) {
  try {
    const { imdbId } = await req.json();

    if (!imdbId || typeof imdbId !== "string" || !imdbId.toLowerCase().startsWith("tt")) {
      return NextResponse.json(
        { error: "Invalid IMDb ID format. Must start with 'tt'." },
        { status: 400 }
      );
    }

    // NEW: Check if we already searched this ID to save time and API costs
    if (analysisCache.has(imdbId)) {
      return NextResponse.json(analysisCache.get(imdbId));
    }

    // 1. Scrape Movie Metadata and Reviews
    const movieData = await scrapeMovieData(imdbId);

    // 2. Analyze Sentiment with Gemini
    const sentimentResult = await analyzeSentiment(movieData.reviews);

    // 3. Create Combined Payload
    const payload = {
      title: movieData.title,
      year: movieData.year,
      rating: movieData.rating,
      poster: movieData.poster,
      plot: movieData.plot,
      cast: movieData.cast,
      sentiment: sentimentResult.summary,
      classification: sentimentResult.classification,
    };

    // NEW: Save to cache before returning
    analysisCache.set(imdbId, payload);
    return NextResponse.json(payload);
    
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze movie." },
      { status: 500 }
    );
  }
}