'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { analyzeStock } from './actions/analyze-stock'
import { FinancialCharts, StockPriceHistory, VolumeChart, MovingAveragesChart, VolatilityChart } from '@/components/charts/FinancialCharts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StockForecast } from '@/components/StockForecast'

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stockData, setStockData] = useState<any>(null)

  const handleAnalyze = async () => {
    if (!ticker) {
      setError('Please enter a stock ticker')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis('')
    setStockData(null)

    try {
      // First fetch the stock data
      const response = await fetch(`/api/stock/${ticker.toUpperCase()}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch stock data')
      }
      const data = await response.json()
      setStockData(data)

      // Then get the AI analysis
      const result = await analyzeStock(ticker)
      setAnalysis(result)
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || 'An error occurred while analyzing the stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">AI Stock Analyzer</h1>
        
        <div className="flex gap-4 mb-8">
          <Input
            placeholder="Enter stock ticker (e.g., AAPL)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="max-w-xs"
          />
          <Button 
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {ticker && (
          <Tabs defaultValue="analysis" className="mb-8">
            <TabsList>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis">
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

            <TabsContent value="charts">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-4">Financial Charts</h2>
                {stockData ? (
                  <FinancialCharts
                    incomeData={stockData.financials.incomeStatement}
                    balanceSheet={stockData.financials.balanceSheet}
                    historicalPrices={stockData.historicalPrices}
                    metrics={{
                      profitMargin: parseFloat(stockData.overview.ProfitMargin || '0'),
                      operatingMargin: parseFloat(stockData.overview.OperatingMarginTTM || '0'),
                      returnOnAssets: parseFloat(stockData.overview.ReturnOnAssetsTTM || '0'),
                      returnOnEquity: parseFloat(stockData.overview.ReturnOnEquityTTM || '0'),
                    }}
                  />
                ) : (
                  <p className="text-gray-500">Enter a stock ticker to see the charts</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="forecast">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-4">Price Forecast</h2>
                {ticker ? (
                  <StockForecast ticker={ticker} />
                ) : (
                  <p className="text-gray-500">Enter a stock ticker to see the forecast</p>
                )}
              </div>
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
      </div>
    </main>
  )
}
