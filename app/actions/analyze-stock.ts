'use server'

import { Anthropic } from '@anthropic-ai/sdk';
import { getStockData, formatNumber, formatPercentage } from '../services/financial';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface StockData {
  overview: {
    Name: string;
    Sector: string;
    Industry: string;
    MarketCapitalization: string;
    PERatio: string;
    Beta: string;
    ProfitMargin: string;
    DividendYield: string;
    QuarterlyEarningsGrowthYOY: string;
    QuarterlyRevenueGrowthYOY: string;
  };
  dailyPrice: {
    close: string;
    change: string;
    changePercent: number;
  };
  historicalPrices: Array<{
    date: string;
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
  }>;
  financials: {
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
  };
  technicalIndicators: {
    ma50: (number | null)[];
    ma200: (number | null)[];
    dailyReturns: number[];
    volatility: (number | null)[];
  };
}

export async function analyzeStock(ticker: string): Promise<string> {
  // Check if AI analysis is disabled
  if (process.env.DISABLE_AI_ANALYSIS === 'true') {
    console.log('AI analysis is disabled for testing');
    return 'AI analysis is disabled for testing. Enable it by setting DISABLE_AI_ANALYSIS=false in your .env file.';
  }

  if (!ticker) {
    throw new Error('Stock ticker is required');
  }

  try {
    const stockData: StockData = await getStockData(ticker.toUpperCase());
    
    const {
      overview,
      dailyPrice,
      historicalPrices,
      financials: { incomeStatement, balanceSheet }
    } = stockData;

    // Format the most recent quarterly data
    const latestQuarter = incomeStatement.quarterlyReports[0];
    const previousQuarter = incomeStatement.quarterlyReports[1];
    const yearAgoQuarter = incomeStatement.quarterlyReports[3];

    // Calculate quarter-over-quarter and year-over-year growth
    const qoqRevenueGrowth = ((parseFloat(latestQuarter.totalRevenue) - parseFloat(previousQuarter.totalRevenue)) / parseFloat(previousQuarter.totalRevenue)) * 100;
    const yoyRevenueGrowth = ((parseFloat(latestQuarter.totalRevenue) - parseFloat(yearAgoQuarter.totalRevenue)) / parseFloat(yearAgoQuarter.totalRevenue)) * 100;
    
    const qoqIncomeGrowth = ((parseFloat(latestQuarter.netIncome) - parseFloat(previousQuarter.netIncome)) / parseFloat(previousQuarter.netIncome)) * 100;
    const yoyIncomeGrowth = ((parseFloat(latestQuarter.netIncome) - parseFloat(yearAgoQuarter.netIncome)) / parseFloat(yearAgoQuarter.netIncome)) * 100;

    // Calculate key financial ratios
    const latestBalanceSheet = balanceSheet.quarterlyReports[0];
    const currentRatio = parseFloat(latestBalanceSheet.totalCurrentAssets) / parseFloat(latestBalanceSheet.totalLiabilities);
    const debtToEquity = parseFloat(latestBalanceSheet.totalLiabilities) / parseFloat(latestBalanceSheet.totalShareholderEquity);

    // Format stock price performance
    const priceChange = dailyPrice.change;
    const priceChangePercent = dailyPrice.changePercent;
    const recentPrices = historicalPrices.slice(-30); // Last 30 days
    const avgPrice = recentPrices.reduce((sum: number, price: any) => sum + price.close, 0) / recentPrices.length;
    const priceVolatility = Math.sqrt(recentPrices.reduce((sum: number, price: any) => sum + Math.pow(price.close - avgPrice, 2), 0) / recentPrices.length);

    const prompt = `You are a professional stock analyst. Analyze the following financial data for ${ticker} (${overview.Name}) and provide a comprehensive but concise analysis. Focus on key insights, trends, and potential risks/opportunities.

Company Overview:
- Sector: ${overview.Sector}
- Industry: ${overview.Industry}
- Market Cap: ${formatNumber(overview.MarketCapitalization)}
- P/E Ratio: ${overview.PERatio}
- Beta: ${overview.Beta}

Recent Stock Performance:
- Current Price: $${dailyPrice.close}
- Daily Change: ${parseFloat(priceChange) > 0 ? '+' : ''}${formatNumber(priceChange)} (${priceChangePercent.toFixed(2)}%)
- 30-Day Price Volatility: ${priceVolatility.toFixed(2)}
- Average 30-Day Price: $${avgPrice.toFixed(2)}

Latest Quarterly Results (${latestQuarter.fiscalDateEnding}):
- Revenue: ${formatNumber(latestQuarter.totalRevenue)}
- Net Income: ${formatNumber(latestQuarter.netIncome)}
- Operating Income: ${formatNumber(latestQuarter.operatingIncome)}

Growth Metrics:
- QoQ Revenue Growth: ${formatPercentage(qoqRevenueGrowth)}
- YoY Revenue Growth: ${formatPercentage(yoyRevenueGrowth)}
- QoQ Net Income Growth: ${formatPercentage(qoqIncomeGrowth)}
- YoY Net Income Growth: ${formatPercentage(yoyIncomeGrowth)}

Financial Health:
- Current Ratio: ${currentRatio.toFixed(2)}
- Debt-to-Equity: ${debtToEquity.toFixed(2)}
- Profit Margin: ${overview.ProfitMargin}
- Dividend Yield: ${overview.DividendYield || '0'}%

Additional Insights:
- Quarterly Earnings Growth YoY: ${overview.QuarterlyEarningsGrowthYOY}
- Quarterly Revenue Growth YoY: ${overview.QuarterlyRevenueGrowthYOY}

Please provide:
1. A brief overview of the company's current position
2. Analysis of financial performance and growth trends
3. Key strengths and potential risks
4. A forward-looking perspective based on the data
5. Any notable red flags or opportunities for investors

Keep the analysis professional but easy to understand. Highlight the most important points that investors should focus on.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1500,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0].text;
    } catch (aiError) {
      console.error('Error calling Claude API:', aiError);
      throw new Error(`AI Analysis failed: ${aiError.message}`);
    }
  } catch (error: any) {
    console.error('Error in analyzeStock:', error);
    // Throw the original error message for better debugging
    throw new Error(error.message || 'Failed to analyze stock data');
  }
}
