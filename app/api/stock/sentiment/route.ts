import { NextResponse } from 'next/server';
import { getSentimentAnalysis } from '@/app/services/sentiment';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  try {
    const sentimentData = await getSentimentAnalysis(symbol);
    return NextResponse.json(sentimentData);
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data' },
      { status: 500 }
    );
  }
}
