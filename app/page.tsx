'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, TrendingUp, LineChart, DollarSign, AlertTriangle, Lightbulb } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { analyzeStock } from "./actions/analyze-stock"

export default function StockAnalyzer() {
  const [ticker, setTicker] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setAnalysis(null)
    
    if (!ticker) {
      setError("Please enter a stock ticker")
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await analyzeStock(ticker)
      setAnalysis(result)
    } catch (err) {
      setError("Failed to analyze stock. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold">AI Stock Analyzer</h1>
          <p className="text-xl text-muted-foreground">
            Get instant AI-powered financial analysis for any publicly traded stock
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter Stock Details</CardTitle>
            <CardDescription>
              Provide a stock ticker symbol to analyze its financial performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ticker">Stock Ticker</Label>
                <div className="flex gap-2">
                  <Input
                    id="ticker"
                    placeholder="Enter ticker symbol (e.g. AAPL)"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isAnalyzing}>
                    {isAnalyzing ? "Analyzing..." : "Analyze"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isAnalyzing && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {analysis && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">{ticker} Analysis</h2>
                  <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
                </div>
                <Badge variant="secondary" className="text-sm">AI Generated</Badge>
              </div>
              
              <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                <div className="prose prose-sm max-w-none">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{analysis}</div>
                </div>
              </ScrollArea>
            </div>
          </Card>
        )}
      </div>
    </main>
  )
}
