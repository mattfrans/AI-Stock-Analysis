export interface CompanyOverview {
  Symbol: string;
  Name: string;
  Description: string;
  Exchange: string;
  Sector: string;
  Industry: string;
  MarketCapitalization: string;
  PERatio: string;
  EPS: string;
  DividendYield: string;
  ProfitMargin: string;
  Beta: string;
  QuarterlyEarningsGrowthYOY: string;
  QuarterlyRevenueGrowthYOY: string;
}

export interface DailyPrice {
  date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  change: string;
  changePercent: number;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FinancialMetrics {
  profitMargin: number;
  operatingMargin: number;
  returnOnAssets: number;
  returnOnEquity: number;
}

export interface FinancialData {
  incomeStatement: {
    quarterlyReports: Array<{
      fiscalDateEnding: string;
      totalRevenue: string;
      netIncome: string;
      operatingIncome: string;
    }>;
  };
  balanceSheet: {
    quarterlyReports: Array<{
      totalCurrentAssets: string;
      totalLiabilities: string;
      totalShareholderEquity: string;
    }>;
  };
}

export interface TechnicalIndicators {
  ma50: (number | null)[];
  ma200: (number | null)[];
  dailyReturns: number[];
  volatility: (number | null)[];
}

export interface YahooFinanceData {
  date: string;
  close: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

export interface StockData {
  overview: CompanyOverview;
  dailyPrice: DailyPrice;
  historicalPrices: HistoricalPrice[];
  financials: FinancialData;
  metrics: FinancialMetrics;
  technicalIndicators?: TechnicalIndicators;
}
