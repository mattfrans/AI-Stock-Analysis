import { NextRequest, NextResponse } from 'next/server';
import { generateStockForecast } from '@/app/services/stockForecast';
import { FinancialServiceError } from '@/app/utils/errors';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 }
    );
  }

  try {
    const forecast = await generateStockForecast(ticker);
    return NextResponse.json(forecast);
  } catch (error) {
    if (error instanceof FinancialServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    } else {
      console.error('Forecast error:', error);
      return NextResponse.json(
        { error: 'Failed to generate forecast' },
        { status: 500 }
      );
    }
  }
}
