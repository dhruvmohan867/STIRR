import { NextResponse } from "next/server";
import { scrapeMovieData } from "../../../lib/imdb";
import { analyzeSentiment } from "../../../lib/gemini";

export async function POST(req: Request) {
  try {
    const { imdbId } = await req.json();

    if (!imdbId || typeof imdbId !== "string" || !imdbId.toLowerCase().startsWith("tt")) {
      return NextResponse.json(
        { error: "Invalid IMDb ID format. Must start with 'tt'." },
        { status: 400 }
      );
    }

    // 1. Scrape Movie Metadata and Reviews
    const movieData = await scrapeMovieData(imdbId);

    // 2. Analyze Sentiment with Gemini
    const sentimentResult = await analyzeSentiment(movieData.reviews);

    // 3. Return Combined Payload
    return NextResponse.json({
      title: movieData.title,
      year: movieData.year,
      rating: movieData.rating,
      poster: movieData.poster,
      plot: movieData.plot,
      cast: movieData.cast,
      sentiment: sentimentResult.summary,
      classification: sentimentResult.classification,
    });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze movie." },
      { status: 500 }
    );
  }
}
