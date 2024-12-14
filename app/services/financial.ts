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

// Rate limiting with request queue
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastCallTime = 0;
  private readonly RATE_LIMIT_DELAY = 12000; // 12 seconds to be safe (5 calls per minute)
  private readonly MAX_RETRIES = 3;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithRetry(fn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, retries = 0): Promise<T> {
    try {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;
      
      if (timeSinceLastCall < this.RATE_LIMIT_DELAY) {
        const waitTime = this.RATE_LIMIT_DELAY - timeSinceLastCall;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      this.lastCallTime = Date.now();
      return await fn();
    } catch (error) {
      if (retries < this.MAX_RETRIES && error instanceof Error && error.message.includes('rate limit')) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
        return this.executeWithRetry(fn, retries + 1);
      }
      throw error;
    }
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }
    
    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();

async function rateLimitedFetch(url: string) {
  return rateLimiter.execute(async () => {
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
        throw new Error('API rate limit exceeded');
      }

      return data;
    } catch (error) {
      console.error('Fetch Error:', error);
      throw error;
    }
  });
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
    
    // Validate the response structure
    if (!data?.chart?.result?.[0]?.indicators?.quote?.[0]) {
      console.error('Invalid Yahoo Finance data structure:', data);
      throw new Error('Invalid data received from Yahoo Finance');
    }
    
    const result = data.chart.result[0];
    const quotes = result.indicators.quote[0];
    const timestamps = result.timestamp;
    
    // Validate required data points
    if (!quotes.close || !quotes.open || !quotes.high || !quotes.low || !quotes.volume) {
      console.error('Missing required price data:', quotes);
      throw new Error('Incomplete price data received from Yahoo Finance');
    }
    
    // Get current price data
    const lastIndex = quotes.close.length - 1;
    if (lastIndex < 0) {
      throw new Error('No price data available');
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
    console.error('Error fetching Yahoo Finance data:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch stock data from Yahoo Finance');
  }
}

export interface FinancialData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap?: number;
}

export async function getFinancialData(symbol: string): Promise<FinancialData> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch financial data');
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      throw new Error('Invalid data format received');
    }

    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const meta = result.meta;
    const timestamp = result.timestamp[result.timestamp.length - 1];
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;

    return {
      symbol: symbol,
      price: currentPrice,
      change: currentPrice - previousClose,
      changePercent: ((currentPrice - previousClose) / previousClose) * 100,
      previousClose: previousClose,
      open: meta.regularMarketOpen,
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
      marketCap: meta.marketCap
    };
  } catch (error) {
    console.error('Error fetching financial data:', error);
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
