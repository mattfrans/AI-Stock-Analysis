export interface FinancialMetrics {
  profitMargin: number;
  operatingMargin: number;
  returnOnAssets: number;
  returnOnEquity: number;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuarterlyReport {
  totalRevenue: string;
  netIncome: string;
  totalCurrentAssets?: string;
  totalLiabilities?: string;
  totalShareholderEquity?: string;
}

export interface FinancialStatement {
  quarterlyReports: QuarterlyReport[];
}

export interface FinancialStatements {
  incomeStatement: FinancialStatement;
  balanceSheet: FinancialStatement;
}

export interface StockData {
  symbol: string;
  name: string;
  overview?: any;
  financials?: FinancialStatements;
  metrics: FinancialMetrics;
  historicalPrices: HistoricalPrice[];
}

export interface FinancialData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  historicalPrices: {
    date: string;
    price: number;
  }[];
}

export interface HistoricalData {
  prices: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

export interface SocialPost {
  platform: 'stocktwits' | 'reddit';
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: number;
  author: string;
  likes: number;
  url: string | null;
}

export interface SentimentData {
  overall: number;  // Range from -1 to 1
  distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  total: number;
  posts: SocialPost[];
}