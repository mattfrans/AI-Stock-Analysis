'use server'

import { Anthropic } from '@anthropic-ai/sdk';
import { getStockData, formatNumber, formatPercentage } from '../services/financial';
import { StockData } from '../types';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
      historicalPrices,
      financials
    } = stockData;

    if (!financials || !financials.incomeStatement || !financials.balanceSheet) {
      throw new Error('Financial data not available');
    }

    const { incomeStatement, balanceSheet } = financials;

    // Format the most recent quarterly data
    const latestQuarter = incomeStatement.quarterlyReports[0] || { totalRevenue: '0', netIncome: '0' };
    const previousQuarter = incomeStatement.quarterlyReports[1] || { totalRevenue: '0', netIncome: '0' };
    const yearAgoQuarter = incomeStatement.quarterlyReports[3] || { totalRevenue: '0', netIncome: '0' };

    // Calculate quarter-over-quarter and year-over-year growth
    const qoqRevenueGrowth = ((parseFloat(latestQuarter.totalRevenue) - parseFloat(previousQuarter.totalRevenue)) / parseFloat(previousQuarter.totalRevenue)) * 100;
    const yoyRevenueGrowth = ((parseFloat(latestQuarter.totalRevenue) - parseFloat(yearAgoQuarter.totalRevenue)) / parseFloat(yearAgoQuarter.totalRevenue)) * 100;
    
    const qoqIncomeGrowth = ((parseFloat(latestQuarter.netIncome) - parseFloat(previousQuarter.netIncome)) / parseFloat(previousQuarter.netIncome)) * 100;
    const yoyIncomeGrowth = ((parseFloat(latestQuarter.netIncome) - parseFloat(yearAgoQuarter.netIncome)) / parseFloat(yearAgoQuarter.netIncome)) * 100;

    // Calculate key financial ratios
    const latestBalanceSheet = balanceSheet.quarterlyReports[0] || {
      totalCurrentAssets: '0',
      totalLiabilities: '0',
      totalShareholderEquity: '0'
    };

    const currentRatio = latestBalanceSheet.totalCurrentAssets && latestBalanceSheet.totalLiabilities
      ? parseFloat(latestBalanceSheet.totalCurrentAssets) / parseFloat(latestBalanceSheet.totalLiabilities)
      : 0;

    const debtToEquity = latestBalanceSheet.totalLiabilities && latestBalanceSheet.totalShareholderEquity
      ? parseFloat(latestBalanceSheet.totalLiabilities) / parseFloat(latestBalanceSheet.totalShareholderEquity)
      : 0;

    // Format stock price performance
    const recentPrices = historicalPrices.slice(-30); // Last 30 days
    const avgPrice = recentPrices.reduce((sum: number, price: any) => sum + price.close, 0) / recentPrices.length;
    const priceVolatility = Math.sqrt(recentPrices.reduce((sum: number, price: any) => sum + Math.pow(price.close - avgPrice, 2), 0) / recentPrices.length);

    // Generate the analysis using Claude
    const prompt = `Analyze the following financial data for ${ticker}:

Key Metrics:
- Market Cap: ${overview.MarketCapitalization}
- P/E Ratio: ${overview.PERatio}
- Beta: ${overview.Beta}

Recent Stock Performance:
- Current Price: $${avgPrice.toFixed(2)}
- 30-Day Price Volatility: ${priceVolatility.toFixed(2)}
- Average 30-Day Price: $${avgPrice.toFixed(2)}

Quarterly Performance:
- Revenue Growth (QoQ): ${formatPercentage(qoqRevenueGrowth)}
- Revenue Growth (YoY): ${formatPercentage(yoyRevenueGrowth)}
- Net Income Growth (QoQ): ${formatPercentage(qoqIncomeGrowth)}
- Net Income Growth (YoY): ${formatPercentage(yoyIncomeGrowth)}

Financial Health:
- Current Ratio: ${formatNumber(currentRatio)}
- Debt-to-Equity: ${formatNumber(debtToEquity)}

Company Overview:
${overview.Description}

Please provide a comprehensive analysis of this stock, including:
1. Overall financial health and stability
2. Growth trends and potential
3. Key risks and opportunities
4. Recommendation for investors

Keep the analysis clear, concise, and focused on the most important aspects that investors should consider.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Error analyzing stock:', error);
    throw error;
  }
}