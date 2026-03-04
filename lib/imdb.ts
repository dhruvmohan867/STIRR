import * as cheerio from "cheerio";

export interface MovieData {
  title: string;
  year: string;
  rating: string;
  poster: string;
  plot: string;
  cast: string;
  reviews: string[];
}

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export async function scrapeMovieData(imdbId: string): Promise<MovieData> {
  const url = `https://www.imdb.com/title/${imdbId}/`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch IMDb page: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Modern IMDb structure uses JSON-LD for rich snippets it's the most reliable way to get metadata
    const jsonLdScript = $('script[type="application/ld+json"]').first().html();
    
    let title = "Unknown Title";
    let year = "N/A";
    let rating = "N/A";
    let poster = "N/A";
    let plot = "N/A";
    let castArray: string[] = [];

    if (jsonLdScript) {
      try {
        const data = JSON.parse(jsonLdScript);
        title = data.name || title;
        if (data.datePublished) year = data.datePublished.substring(0, 4);
        if (data.aggregateRating?.ratingValue) rating = String(data.aggregateRating.ratingValue);
        if (data.image) poster = data.image;
        if (data.description) plot = data.description;
        if (data.actor) {
           castArray = data.actor.map((a: any) => a.name).slice(0, 5); // Take top 5
        }
      } catch (e) {
        console.error("Failed to parse JSON-LD", e);
      }
    }

    const cast = castArray.length > 0 ? castArray.join(", ") : "Cast information unavailable";

    // Scrape reviews
    const reviews = await scrapeReviews(imdbId);

    return { title, year, rating, poster, plot, cast, reviews };
  } catch (error) {
    console.error("Scraping error:", error);
    throw new Error("Could not retrieve movie data from IMDb.");
  }
}

async function scrapeReviews(imdbId: string): Promise<string[]> {
  const url = `https://www.imdb.com/title/${imdbId}/reviews/`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);

    const reviews: string[] = [];
    
    // 1. Create a list of all the ways IMDb might hide the reviews
    const possibleSelectors = [
      '.ipc-html-content-inner-div', // Newer IMDb layout
      '.text.show-more__control',    // The old layout you originally used
      'div.text',                    // Generic fallback
      '.review-container .text'      // Another older layout
    ];

    // 2. Try each CSS selector one by one
    for (const selector of possibleSelectors) {
      $(selector).each((i, el) => {
        if (i < 10) { // Limit to 10 reviews
          reviews.push($(el).text().trim());
        }
      });
      
      // 3. If we successfully found reviews with this selector, stop looking!
      if (reviews.length > 0) {
         break; 
      }
    }

    // 4. Safety check warning so you know if it completely fails in the future
    if (reviews.length === 0) {
      console.warn(`[Scraper Warning]: 0 reviews found for ${imdbId}. IMDb may have changed their HTML/CSS again.`);
    }

    return reviews;
  } catch (e) {
    console.error("Review scraping error:", e);
    return [];
  }
}