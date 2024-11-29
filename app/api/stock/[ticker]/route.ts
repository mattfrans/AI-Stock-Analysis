import { getStockData } from '@/app/services/financial'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { ticker: string } }
) {
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    )
  }

  try {
    const ticker = params.ticker.toUpperCase()
    if (!ticker || ticker.length < 1 || ticker.length > 5) {
      return NextResponse.json(
        { error: 'Invalid stock ticker' },
        { status: 400 }
      )
    }

    const data = await getStockData(ticker)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching stock data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}
