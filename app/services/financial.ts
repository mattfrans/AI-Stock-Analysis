import { StockData, CompanyOverview, DailyPrice, HistoricalPrice, FinancialData, TechnicalIndicators, YahooFinanceData } from '../types';
import { FinancialServiceError } from '../utils/errors';

// Debug logging
console.log('Financial Service Initialization:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV
});

const YAHOO_FINANCE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Helper function to validate stock symbol format
function validateSymbol(symbol: string): boolean {
  return /^[A-Z0-9.]{1,10}$/.test(symbol);
}

// Enhanced fetch with retry logic and better error handling
async function enhancedFetch(url: string, retries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 404) {
        throw new FinancialServiceError(
          'Stock symbol not found',
          'INVALID_SYMBOL'
        );
      }
      
      if (response.status === 429) {
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw new FinancialServiceError(
          'Rate limit exceeded. Please try again later.',
          'API_ERROR'
        );
      }
      
      if (!response.ok) {
        throw new FinancialServiceError(
          `API request failed with status ${response.status}`,
          'API_ERROR'
        );
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (error instanceof FinancialServiceError) {
        throw error;
      }
      
      if (attempt === retries - 1) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new FinancialServiceError(
            'Unable to connect to the financial data service. Please check your internet connection.',
            'NETWORK_ERROR',
            error
          );
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  throw new FinancialServiceError(
    'Failed to fetch financial data after multiple attempts',
    'NETWORK_ERROR',
    lastError
  );
}

// Yahoo Finance API call (no rate limiting needed)
async function fetchYahooFinanceData(symbol: string) {
  if (!validateSymbol(symbol)) {
    throw new FinancialServiceError(
      'Invalid stock symbol format',
      'INVALID_SYMBOL'
    );
  }

  const interval = '1d';
  const range = '1y';
  const url = `${YAHOO_FINANCE_URL}/${symbol}?interval=${interval}&range=${range}`;
  
  try {
    const response = await enhancedFetch(url);
    const data = await response.json();
    
    // Validate the response structure
    if (!data?.chart?.result?.[0]?.indicators?.quote?.[0]) {
      throw new FinancialServiceError(
        'Invalid data format received from API',
        'DATA_FORMAT_ERROR'
      );
    }
    
    const result = data.chart.result[0];
    const quotes = result.indicators.quote[0];
    const timestamps = result.timestamp;
    
    // Validate required data points
    if (!quotes.close || !quotes.open || !quotes.high || !quotes.low || !quotes.volume) {
      throw new FinancialServiceError(
        'Missing required price data',
        'DATA_FORMAT_ERROR'
      );
    }
    
    // Get current price data
    const lastIndex = quotes.close.length - 1;
    if (lastIndex < 0) {
      throw new FinancialServiceError(
        'No price data available',
        'DATA_FORMAT_ERROR'
      );
    }
    
    const dailyPrice: DailyPrice = {
      date: new Date(timestamps[lastIndex] * 1000).toISOString().split('T')[0],
      open: quotes.open[lastIndex].toString(),
      high: quotes.high[lastIndex].toString(),
      low: quotes.low[lastIndex].toString(),
      close: quotes.close[lastIndex].toString(),
      volume: quotes.volume[lastIndex].toString(),
      change: (quotes.close[lastIndex] - quotes.close[lastIndex - 1]).toString(),
      changePercent: ((quotes.close[lastIndex] - quotes.close[lastIndex - 1]) / quotes.close[lastIndex - 1] * 100)
    };

    // Get historical prices
    const historicalPrices: YahooFinanceData[] = timestamps.map((timestamp: number, i: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: quotes.open[i] || 0,
      high: quotes.high[i] || 0,
      low: quotes.low[i] || 0,
      close: quotes.close[i] || 0,
      volume: quotes.volume[i] || 0
    }));

    return { dailyPrice, historicalPrices };
  } catch (error) {
    if (error instanceof FinancialServiceError) {
      throw error;
    }
    
    console.error('Error fetching Yahoo Finance data:', error);
    throw new FinancialServiceError(
      'Failed to fetch Yahoo Finance data',
      'API_ERROR',
      error
    );
  }
}

export async function getFinancialData(symbol: string): Promise<FinancialData> {
  if (!validateSymbol(symbol)) {
    throw new FinancialServiceError(
      'Invalid stock symbol format',
      'INVALID_SYMBOL'
    );
  }

  try {
    // Fixed URL construction - there was an extra slash after the base URL
    const url = `${YAHOO_FINANCE_URL}${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    console.log('Fetching financial data from:', url);
    
    const response = await enhancedFetch(url);
    const data = await response.json();
    
    console.log('Received data:', JSON.stringify(data, null, 2));
    
    if (!data.chart?.result?.[0]) {
      console.error('Invalid data structure:', data);
      throw new FinancialServiceError(
        'Invalid data format received from API',
        'DATA_FORMAT_ERROR'
      );
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    
    if (!meta.regularMarketPrice) {
      console.error('Missing market data:', meta);
      throw new FinancialServiceError(
        'No market data available for this symbol',
        'DATA_FORMAT_ERROR'
      );
    }

    const financialData = {
      symbol: symbol,
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      previousClose: meta.previousClose,
      open: meta.regularMarketOpen,
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
      marketCap: meta.marketCap
    };

    console.log('Processed financial data:', financialData);
    return financialData;
  } catch (error) {
    if (error instanceof FinancialServiceError) {
      throw error;
    }
    
    console.error('Error fetching financial data:', error);
    throw new FinancialServiceError(
      'Failed to fetch financial data',
      'API_ERROR',
      error
    );
  }
}

export async function getHistoricalPrices(symbol: string): Promise<YahooFinanceData[]> {
  if (!validateSymbol(symbol)) {
    throw new FinancialServiceError(
      'Invalid stock symbol format',
      'INVALID_SYMBOL'
    );
  }

  const endDate = Math.floor(Date.now() / 1000);
  const startDate = endDate - (5 * 365 * 24 * 60 * 60); // 5 years ago

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
  
  try {
    const response = await enhancedFetch(url);
    const data = await response.json();
    const timestamps = data.chart.result[0].timestamp;
    const quotes = data.chart.result[0].indicators.quote[0];
    
    return timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      close: quotes.close[index] || 0,
      volume: quotes.volume[index] || 0,
      high: quotes.high[index] || 0,
      low: quotes.low[index] || 0,
      open: quotes.open[index] || 0
    }));
  } catch (error) {
    if (error instanceof FinancialServiceError) {
      throw error;
    }
    
    console.error('Error fetching historical prices:', error);
    throw new FinancialServiceError(
      'Failed to fetch historical prices',
      'API_ERROR',
      error
    );
  }
}

// Calculate technical indicators
export function calculateTechnicalIndicators(prices: YahooFinanceData[]) {
  // Calculate 50-day and 200-day moving averages
  const calculateMA = (period: number) => {
    return prices.map((_, index) => {
      if (index < period - 1) return null;
      const sum = prices.slice(index - period + 1, index + 1).reduce((acc, curr) => acc + curr.close, 0);
      return sum / period;
    });
  };

  // Calculate daily returns
  const dailyReturns = prices.map((price, index) => {
    if (index === 0) return 0;
    return ((price.close - prices[index - 1].close) / prices[index - 1].close) * 100;
  });

  // Calculate volatility (20-day rolling standard deviation of returns)
  const volatility = dailyReturns.map((_, index) => {
    if (index < 20) return null;
    const periodReturns = dailyReturns.slice(index - 20, index);
    const mean = periodReturns.reduce((acc, curr) => acc + curr, 0) / 20;
    const squaredDiffs = periodReturns.map(r => Math.pow(r - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((acc, curr) => acc + curr, 0) / 20);
  });

  return {
    ma50: calculateMA(50),
    ma200: calculateMA(200),
    dailyReturns,
    volatility
  };
}

export async function getStockData(symbol: string): Promise<StockData> {
  console.log('Starting stock data fetch for:', symbol);

  try {
    // Fetch price data from Yahoo Finance (no rate limit)
    console.log('Fetching price data from Yahoo Finance...');
    const { dailyPrice, historicalPrices } = await fetchYahooFinanceData(symbol);

    // Fetch 5-year historical prices
    console.log('Fetching 5-year historical prices...');
    const fiveYearHistoricalPrices = await getHistoricalPrices(symbol);

    // Calculate technical indicators
    const technicalIndicators = calculateTechnicalIndicators(fiveYearHistoricalPrices);

    console.log('Successfully fetched all data for:', symbol);

    return {
      dailyPrice,
      historicalPrices: fiveYearHistoricalPrices,
      technicalIndicators
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error in getStockData:', {
      symbol,
      error: errorMessage,
      stack: errorStack
    });
    throw error;
  }
}

export function formatNumber(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'N/A';
  
  if (Math.abs(num) >= 1e12) {
    return (num / 1e12).toFixed(2) + 'T';
  } else if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  
  return num.toFixed(2);
}

export function formatPercentage(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'N/A';
  return num.toFixed(2) + '%';
}
