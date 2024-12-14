import { NextResponse } from 'next/server';

// Cache successful responses for 5 minutes
const CACHE_DURATION = 300; // 5 minutes in seconds

// In-memory cache for stock data
const stockCache = new Map<string, { data: any; timestamp: number }>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const symbol = query.toUpperCase();
  console.log('Searching for symbol:', symbol);

  // Check cache first
  const cachedData = stockCache.get(symbol);
  const now = Math.floor(Date.now() / 1000);
  
  if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
    console.log('Returning cached data for:', symbol);
    return NextResponse.json(cachedData.data);
  }

  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      throw new Error('Alpha Vantage API key is not configured');
    }

    // Use Alpha Vantage's Symbol Search endpoint
    const searchUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    console.log('Fetching data from Alpha Vantage');
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.Note) {
      console.warn('Alpha Vantage API limit warning:', data.Note);
      return NextResponse.json({ error: 'API rate limit reached. Please try again later.' }, { status: 429 });
    }

    const matches = data.bestMatches || [];
    if (matches.length === 0) {
      return NextResponse.json({ error: 'Stock symbol not found' }, { status: 404 });
    }

    const result = {
      results: matches.map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        currency: match['8. currency'],
        exchange: match['5. marketOpen'] ? 'US Exchange' : match['4. region'] + ' Exchange'
      }))
    };

    // Cache the successful response
    stockCache.set(symbol, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching stock symbol:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data. Please try again.' },
      { status: 500 }
    );
  }
}
