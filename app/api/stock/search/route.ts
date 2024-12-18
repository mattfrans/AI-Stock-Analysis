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
    console.log('Fetching data from Yahoo Finance');
    const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Yahoo Finance response:', data);

    if (!data.quotes || data.quotes.length === 0) {
      return NextResponse.json({ error: 'Stock symbol not found' }, { status: 404 });
    }

    const result = {
      results: data.quotes.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        type: quote.quoteType,
        exchange: quote.exchange,
        currency: quote.currency || 'USD'
      }))
    };

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