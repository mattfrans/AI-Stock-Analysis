export interface FinancialStatement {
  date: string;
  period: 'annual' | 'quarterly';
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  cashAndCashEquivalents?: number;
  shortTermInvestments?: number;
  netIncome?: number;
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  ebitda?: number;
  freeCashFlow?: number;
}

export async function getBalanceSheet(symbol: string, quarterly = false): Promise<FinancialStatement[]> {
  try {
    const module = quarterly ? 'balanceSheetHistoryQuarterly' : 'balanceSheetHistory';
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${module}`;
    console.log('Fetching balance sheet from:', url);
    
    const response = await fetch(url);
    console.log('Balance sheet response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch balance sheet data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Balance sheet data received:', JSON.stringify(data, null, 2));
    
    const balanceSheets = data.quoteSummary?.result?.[0]?.[module]?.balanceSheetStatements || [];

    if (!balanceSheets.length) {
      console.warn('No balance sheet data available for:', symbol);
    }

    return balanceSheets.map((statement: any) => ({
      date: new Date(statement.endDate.raw * 1000).toISOString().split('T')[0],
      period: quarterly ? 'quarterly' : 'annual',
      totalAssets: statement.totalAssets?.raw,
      totalLiabilities: statement.totalLiab?.raw,
      totalEquity: statement.stockholdersEquity?.raw,
      cashAndCashEquivalents: statement.cash?.raw,
      shortTermInvestments: statement.shortTermInvestments?.raw
    }));
  } catch (error) {
    console.error('Error fetching balance sheet:', error);
    throw error;
  }
}

export async function getIncomeStatement(symbol: string, quarterly = false): Promise<FinancialStatement[]> {
  try {
    const module = quarterly ? 'incomeStatementHistoryQuarterly' : 'incomeStatementHistory';
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${module}`;
    console.log('Fetching income statement from:', url);
    
    const response = await fetch(url);
    console.log('Income statement response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch income statement data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Income statement data received:', JSON.stringify(data, null, 2));
    
    const incomeStatements = data.quoteSummary?.result?.[0]?.[module]?.incomeStatementHistory || [];

    if (!incomeStatements.length) {
      console.warn('No income statement data available for:', symbol);
    }

    return incomeStatements.map((statement: any) => ({
      date: new Date(statement.endDate.raw * 1000).toISOString().split('T')[0],
      period: quarterly ? 'quarterly' : 'annual',
      revenue: statement.totalRevenue?.raw,
      grossProfit: statement.grossProfit?.raw,
      operatingIncome: statement.operatingIncome?.raw,
      netIncome: statement.netIncome?.raw,
      ebitda: statement.ebitda?.raw
    }));
  } catch (error) {
    console.error('Error fetching income statement:', error);
    throw error;
  }
}

export async function getCashFlow(symbol: string, quarterly = false): Promise<FinancialStatement[]> {
  try {
    const module = quarterly ? 'cashflowStatementHistoryQuarterly' : 'cashflowStatementHistory';
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${module}`;
    console.log('Fetching cash flow from:', url);
    
    const response = await fetch(url);
    console.log('Cash flow response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch cash flow data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Cash flow data received:', JSON.stringify(data, null, 2));
    
    const cashFlows = data.quoteSummary?.result?.[0]?.[module]?.cashflowStatements || [];

    if (!cashFlows.length) {
      console.warn('No cash flow data available for:', symbol);
    }

    return cashFlows.map((statement: any) => ({
      date: new Date(statement.endDate.raw * 1000).toISOString().split('T')[0],
      period: quarterly ? 'quarterly' : 'annual',
      freeCashFlow: statement.freeCashFlow?.raw,
      operatingIncome: statement.operatingCashFlow?.raw
    }));
  } catch (error) {
    console.error('Error fetching cash flow:', error);
    throw error;
  }
}

// Helper function to get all financial statements at once
export async function getAllFinancialStatements(
  symbol: string,
  quarterly = false
): Promise<{
  balanceSheet: FinancialStatement[];
  incomeStatement: FinancialStatement[];
  cashFlow: FinancialStatement[];
}> {
  try {
    const [balanceSheet, incomeStatement, cashFlow] = await Promise.all([
      getBalanceSheet(symbol, quarterly),
      getIncomeStatement(symbol, quarterly),
      getCashFlow(symbol, quarterly)
    ]);

    return {
      balanceSheet,
      incomeStatement,
      cashFlow
    };
  } catch (error) {
    console.error('Error fetching all financial statements:', error);
    throw error;
  }
}
