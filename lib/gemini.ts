import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

// Create instance safely to handle case where API key isn't provided yet
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface SentimentResult {
  summary: string;
  classification: "positive" | "mixed" | "negative";
}

export async function analyzeSentiment(reviews: string[]): Promise<SentimentResult> {
  const defaultResponse: SentimentResult = {
    summary: "Mock Mode: API key not provided. (Imagine a detailed AI summary of these reviews here, highlighting whether audiences loved the cinematography or hated the pacing).",
    classification: "mixed",
  };

  if (!ai || !apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set. Returning mock sentiment.");
    return defaultResponse;
  }

  if (reviews.length === 0) {
    return {
      summary: "No reviews were available to analyze for this movie.",
      classification: "mixed", // Default
    };
  }

  const prompt = `
    Analyze the following user reviews for a movie.
    Provide a cohesive, insightful 2-3 sentence summary of the general audience sentiment. 
    Also, classify the overall sentiment as exactly one of these three words: "positive", "mixed", or "negative".
    
    Format your response EXACTLY as a JSON object with two keys:
    {
      "summary": "Your 2-3 sentence summary here.",
      "classification": "positive or mixed or negative"
    }
    
    Reviews to analyze:
    ${reviews.map((r, i) => `[Review ${i + 1}]: ${r}`).join("\n")}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (text) {
        try {
           const result = JSON.parse(text);
           return {
               summary: result.summary || "Summary generation failed.",
               classification: ["positive", "mixed", "negative"].includes(result.classification?.toLowerCase()) 
                 ? result.classification.toLowerCase() 
                 : "mixed"
           };
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", e);
            throw new Error("Failed to parse sentiment data");
        }
    }
    
    throw new Error("Empty response from AI");
    
  } catch (error) {
    console.error("Gemini AI Sentiment analysis failed:", error);
    return {
      summary: "AI analysis failed due to an error connecting to the service.",
      classification: "mixed",
    };
  }
}
