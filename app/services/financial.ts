import { StockData, CompanyOverview, DailyPrice, HistoricalPrice, FinancialData, TechnicalIndicators, YahooFinanceData } from '../types';

// Debug logging
console.log('Financial Service Initialization:', {
  ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY ? 'Set' : 'Not Set',
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV
});

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';
const YAHOO_FINANCE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Rate limiting helper
let lastCallTime = 0;
const RATE_LIMIT_DELAY = 12000; // 12 seconds to be safe (5 calls per minute)

async function rateLimitedFetch(url: string) {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  
  if (timeSinceLastCall < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastCall;
    console.log(`Rate limiting: waiting ${waitTime}ms before next call`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastCallTime = Date.now();
  const sanitizedUrl = url.replace(ALPHA_VANTAGE_API_KEY || '', '[API_KEY]');
  console.log('Fetching:', sanitizedUrl);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: sanitizedUrl
      });
      throw new Error(`API call failed: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    
    // Check for Alpha Vantage error messages
    if (data['Error Message']) {
      console.error('Alpha Vantage Error:', data['Error Message']);
      throw new Error(data['Error Message']);
    }
    
    // Check for rate limit messages
    if (data.Note && data.Note.includes('API call frequency')) {
      console.error('Rate Limit Hit:', data.Note);
      throw new Error('API rate limit exceeded. Please try again in a minute.');
    }

    return data;
  } catch (error) {
    console.error('Fetch Error:', error);
    throw error;
  }
}

// Yahoo Finance API call (no rate limiting needed)
async function fetchYahooFinanceData(symbol: string) {
  const interval = '1d';
  const range = '1y';
  const url = `${YAHOO_FINANCE_URL}/${symbol}?interval=${interval}&range=${range}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Yahoo Finance API Error:', {
        status: response.status,
        statusText: response.statusText,
        url
      });
      throw new Error(`Yahoo Finance API call failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.chart?.result?.[0]) {
      console.error('No price data available:', data);
      throw new Error('No price data available');
    }
    
    const result = data.chart.result[0];
    const quotes = result.indicators.quote[0];
    const timestamps = result.timestamp;
    
    // Get current price data
    const lastIndex = quotes.close.length - 1;
    const dailyPrice: DailyPrice = {
      date: new Date(timestamps[lastIndex] * 1000).toISOString().split('T')[0],
      open: quotes.open[lastIndex].toString(),
      high: quotes.high[lastIndex].toString(),
      low: quotes.low[lastIndex].toString(),
      close: quotes.close[lastIndex].toString(),
      volume: quotes.volume[lastIndex].toString(),
      change: (quotes.close[lastIndex] - quotes.close[lastIndex - 1]).toString(),
      changePercent: ((quotes.close[lastIndex] - quotes.close[lastIndex - 1]) / quotes.close[lastIndex - 1]) * 100
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
    console.error('Error fetching Yahoo Finance data:', error);
    throw error;
  }
}

export async function getHistoricalPrices(symbol: string): Promise<YahooFinanceData[]> {
  const endDate = Math.floor(Date.now() / 1000);
  const startDate = endDate - (5 * 365 * 24 * 60 * 60); // 5 years ago

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Historical Prices API Error:', {
        status: response.status,
        statusText: response.statusText,
        url
      });
      throw new Error(`Failed to fetch historical prices: ${response.statusText}`);
    }
    
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
    console.error('Error fetching historical prices:', error);
    return [];
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
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
  }

  console.log('Starting stock data fetch for:', symbol);

  try {
    // Fetch price data from Yahoo Finance (no rate limit)
    console.log('Fetching price data from Yahoo Finance...');
    const { dailyPrice, historicalPrices } = await fetchYahooFinanceData(symbol);

    // 1. Fetch company overview from Alpha Vantage
    console.log('Fetching company overview...');
    const overviewUrl = `${ALPHA_VANTAGE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const overview = await rateLimitedFetch(overviewUrl);
    
    // Log the overview data to debug
    console.log('Overview data received:', overview);
    
    // Check if we got a valid response with actual data
    if (!overview || Object.keys(overview).length === 0) {
      throw new Error(`No overview data available for symbol: ${symbol}`);
    }

    // Alpha Vantage sometimes returns an empty object for invalid symbols
    if (!overview.Symbol && !overview.Name) {
      throw new Error(`Invalid stock symbol: ${symbol}`);
    }

    // 2. Fetch income statement
    console.log('Fetching income statement...');
    const incomeUrl = `${ALPHA_VANTAGE_URL}?function=INCOME_STATEMENT&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const incomeStatement = await rateLimitedFetch(incomeUrl);

    if (!incomeStatement.quarterlyReports || !incomeStatement.quarterlyReports.length) {
      throw new Error('Failed to fetch income statement data');
    }

    // 3. Fetch balance sheet
    console.log('Fetching balance sheet...');
    const balanceUrl = `${ALPHA_VANTAGE_URL}?function=BALANCE_SHEET&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const balanceSheet = await rateLimitedFetch(balanceUrl);

    if (!balanceSheet.quarterlyReports || !balanceSheet.quarterlyReports.length) {
      throw new Error('Failed to fetch balance sheet data');
    }

    // Fetch 5-year historical prices
    console.log('Fetching 5-year historical prices...');
    const fiveYearHistoricalPrices = await getHistoricalPrices(symbol);

    // Calculate technical indicators
    const technicalIndicators = calculateTechnicalIndicators(fiveYearHistoricalPrices);

    console.log('Successfully fetched all data for:', symbol);

    return {
      overview,
      dailyPrice,
      historicalPrices: fiveYearHistoricalPrices,
      financials: {
        incomeStatement,
        balanceSheet
      },
      technicalIndicators
    };
  } catch (error) {
    console.error('Error in getStockData:', {
      symbol,
      error: error.message,
      stack: error.stack
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
