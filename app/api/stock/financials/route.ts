import { NextResponse } from 'next/server';
import { getAllFinancialStatements } from '@/app/services/financialStatements';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const quarterly = searchParams.get('quarterly') === 'true';

  if (!symbol) {
    return NextResponse.json({ error: 'Stock symbol is required' }, { status: 400 });
  }

  try {
    const financials = await getAllFinancialStatements(symbol, quarterly);
    return NextResponse.json(financials);
  } catch (error) {
    console.error('Error fetching financial statements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial statements' },
      { status: 500 }
    );
  }
}
