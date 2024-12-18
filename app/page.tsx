'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { analyzeStock } from './actions/analyze-stock'
import { FinancialCharts, StockPriceHistory, VolumeChart, MovingAveragesChart, VolatilityChart } from '@/components/charts/FinancialCharts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StockForecast } from '@/components/StockForecast'
import { StockSearchInput } from '@/components/StockSearchInput'
import { StockData, FinancialMetrics, HistoricalData } from './types'
import { PriceChart } from '@/components/charts/PriceChart'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { BalanceSheetChart } from '@/components/charts/BalanceSheetChart'
import { CashFlowChart } from '@/components/charts/CashFlowChart'
import { FinancialMetricsChart } from '@/components/charts/FinancialMetricsChart'
import { getFinancialData, getHistoricalPrices } from '@/app/services/financial'
import { getAllFinancialStatements } from '@/app/services/financialStatements'
import { SentimentAnalysis } from '@/components/SentimentAnalysis'
import { getErrorMessage } from '@/app/utils/errors'

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null)
  const [hasData, setHasData] = useState(false)
  const [financialStatements, setFinancialStatements] = useState<any>(null)
  const [showQuarterly, setShowQuarterly] = useState(false)
  const [activeTab, setActiveTab] = useState('analysis')

  const handleAnalyze = async () => {
    if (!ticker) {
      setError('Please enter a stock ticker')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis('')

    try {
      const [priceData, historicalData, statements] = await Promise.all([
        getFinancialData(ticker),
        getHistoricalPrices(ticker),
        getAllFinancialStatements(ticker, showQuarterly)
      ]);

      // Transform priceData to match StockData type
      const transformedStockData: StockData = {
        symbol: priceData.symbol,
        name: priceData.symbol,
        metrics: {
          profitMargin: 0,
          operatingMargin: 0,
          returnOnAssets: 0,
          returnOnEquity: 0
        },
        historicalPrices: priceData.historicalPrices.map(p => ({
          date: p.date,
          open: p.price,
          high: p.price,
          low: p.price,
          close: p.price,
          volume: 0
        }))
      };

      const transformedHistoricalData: HistoricalData = {
        prices: historicalData.map(price => ({
          date: price.date,
          open: price.open,
          high: price.high,
          low: price.low,
          close: price.close,
          volume: price.volume
        }))
      };

      setStockData(transformedStockData);
      setHistoricalData(transformedHistoricalData);
      setFinancialStatements(statements);
      setHasData(true);

      // Get AI analysis
      const result = await analyzeStock(ticker)
      setAnalysis(result)
      setActiveTab('analysis')
    } catch (error) {
      console.error('Error:', error)
      setError(getErrorMessage(error))
      setHasData(false)
    } finally {
      setLoading(false)
    }
  }

  const handleStockSelect = (symbol: string) => {
    setTicker(symbol)
    setError('')
    handleAnalyze()
  }

  const toggleDataFrequency = async () => {
    if (!ticker) return;
    
    setLoading(true);
    try {
      const statements = await getAllFinancialStatements(ticker, !showQuarterly);
      setFinancialStatements(statements);
      setShowQuarterly(!showQuarterly);
    } catch (error) {
      console.error('Error toggling data frequency:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 gap-4 bg-background">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm flex gap-4">
        <div className="flex-1">
          <StockSearchInput onStockSelect={handleStockSelect} />
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={loading || !ticker}
          className="w-32"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasData && (
        <Tabs value={activeTab} className="w-full max-w-6xl space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analysis" onClick={() => setActiveTab('analysis')}>Analysis</TabsTrigger>
            <TabsTrigger value="charts" onClick={() => setActiveTab('charts')}>Charts</TabsTrigger>
            <TabsTrigger value="forecast" onClick={() => setActiveTab('forecast')}>Forecast</TabsTrigger>
            <TabsTrigger value="sentiment" onClick={() => setActiveTab('sentiment')}>Sentiment</TabsTrigger>
            <TabsTrigger value="financials" onClick={() => setActiveTab('financials')}>Financials</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stockData && <StockPriceHistory data={stockData} />}
              {stockData && <VolumeChart data={stockData} />}
              {stockData && <MovingAveragesChart data={stockData} />}
              {stockData && <VolatilityChart data={stockData} />}
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <pre className="whitespace-pre-wrap">{analysis}</pre>
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            {stockData && financialStatements && (
              <FinancialCharts 
                incomeData={financialStatements.incomeStatements}
                balanceSheet={financialStatements.balanceSheets}
                historicalPrices={stockData.historicalPrices}
                metrics={stockData.metrics}
              />
            )}
          </TabsContent>

          <TabsContent value="forecast" className="space-y-4">
            {stockData && <StockForecast ticker={stockData.symbol} />}
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <SentimentAnalysis symbol={ticker} />
          </TabsContent>

          <TabsContent value="financials" className="space-y-4">
            {financialStatements && (
              <>
                <div className="flex justify-end mb-4">
                  <Button onClick={toggleDataFrequency} disabled={loading}>
                    Show {showQuarterly ? 'Annual' : 'Quarterly'} Data
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <RevenueChart data={financialStatements.incomeStatements} />
                  <FinancialMetricsChart data={financialStatements.incomeStatements} />
                  <BalanceSheetChart data={financialStatements.balanceSheets} />
                  <CashFlowChart data={financialStatements.cashFlowStatements} />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}