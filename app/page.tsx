'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { analyzeStock } from './actions/analyze-stock'
import { FinancialCharts, StockPriceHistory, VolumeChart, MovingAveragesChart, VolatilityChart } from '@/components/charts/FinancialCharts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StockForecast } from '@/components/StockForecast'
import { StockSearchInput } from '@/components/StockSearchInput'
import { StockData, FinancialMetrics } from './types'
import { PriceChart } from '@/components/charts/PriceChart'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { BalanceSheetChart } from '@/components/charts/BalanceSheetChart'
import { CashFlowChart } from '@/components/charts/CashFlowChart'
import { FinancialMetricsChart } from '@/components/charts/FinancialMetricsChart'
import { getFinancialData, getHistoricalPrices } from '@/app/services/financial'
import { getAllFinancialStatements } from '@/app/services/financialStatements'

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [hasData, setHasData] = useState(false)
  const [financialStatements, setFinancialStatements] = useState<any>(null);
  const [showQuarterly, setShowQuarterly] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');

  const handleAnalyze = async () => {
    if (!ticker) {
      setError('Please enter a stock ticker')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis('')

    try {
      // First fetch the stock data
      const response = await fetch(`/api/stock/${ticker.toUpperCase()}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stock data')
      }
      
      // Validate the data structure
      if (!data.historicalPrices || !Array.isArray(data.historicalPrices)) {
        throw new Error('Invalid stock data format')
      }

      // Ensure all required financial metrics are present with fallback values
      const metrics: FinancialMetrics = {
        profitMargin: parseFloat(data.overview?.ProfitMargin || '0'),
        operatingMargin: parseFloat(data.overview?.OperatingMarginTTM || '0'),
        returnOnAssets: parseFloat(data.overview?.ReturnOnAssetsTTM || '0'),
        returnOnEquity: parseFloat(data.overview?.ReturnOnEquityTTM || '0')
      }

      // Validate and transform the data
      const validatedData: StockData = {
        ...data,
        financials: {
          incomeStatement: data.financials?.incomeStatement || [],
          balanceSheet: data.financials?.balanceSheet || []
        },
        metrics,
        historicalPrices: data.historicalPrices.map((price: any) => ({
          date: price.date,
          open: Number(price.open) || 0,
          high: Number(price.high) || 0,
          low: Number(price.low) || 0,
          close: Number(price.close) || 0,
          volume: Number(price.volume) || 0
        }))
      }
      
      setStockData(validatedData)
      setHasData(true)

      // Then get the AI analysis
      const result = await analyzeStock(ticker)
      setAnalysis(result)

      const [priceData, historicalData, statements] = await Promise.all([
        getFinancialData(ticker),
        getHistoricalPrices(ticker),
        getAllFinancialStatements(ticker, showQuarterly)
      ]);

      setStockData(priceData);
      setHistoricalData(historicalData);
      setFinancialStatements(statements);
      setActiveTab('analysis');
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred while analyzing the stock')
      setHasData(false)
    } finally {
      setLoading(false)
    }
  }

  const handleStockSelect = (symbol: string) => {
    setTicker(symbol)
    handleAnalyze()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-5">
          AI Stock Analysis
        </h1>
        <StockSearchInput
          onStockSelect={handleStockSelect}
        />
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(hasData || ticker) && (
          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-4">AI Analysis</h2>
                {loading ? (
                  <p>Analyzing stock data...</p>
                ) : analysis ? (
                  <div className="prose max-w-none">
                    {analysis.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Enter a stock ticker to see the analysis</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="charts" className="mt-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-4">Financial Charts</h2>
                {stockData ? (
                  <FinancialCharts
                    incomeData={stockData.financials.incomeStatement}
                    balanceSheet={stockData.financials.balanceSheet}
                    historicalPrices={stockData.historicalPrices}
                    metrics={stockData.metrics}
                  />
                ) : (
                  <p className="text-gray-500">Enter a stock ticker to see the charts</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="forecast" className="mt-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-4">Price Forecast</h2>
                {ticker ? (
                  <StockForecast ticker={ticker} />
                ) : (
                  <p className="text-gray-500">Enter a stock ticker to see the forecast</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="financials" className="space-y-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowQuarterly(!showQuarterly)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {showQuarterly ? 'Show Annual' : 'Show Quarterly'}
                </button>
              </div>
              
              {financialStatements ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RevenueChart 
                    data={financialStatements.incomeStatement} 
                    quarterly={showQuarterly} 
                  />
                  <BalanceSheetChart 
                    data={financialStatements.balanceSheet} 
                    quarterly={showQuarterly} 
                  />
                  <CashFlowChart 
                    data={financialStatements.cashFlow} 
                    quarterly={showQuarterly} 
                  />
                  <FinancialMetricsChart 
                    data={financialStatements.incomeStatement} 
                    quarterly={showQuarterly} 
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No financial data available
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {stockData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <StockPriceHistory data={stockData} />
            <MovingAveragesChart data={stockData} />
            <VolumeChart data={stockData} />
            <VolatilityChart data={stockData} />
          </div>
        )}
      </main>
    </div>
  )
}
