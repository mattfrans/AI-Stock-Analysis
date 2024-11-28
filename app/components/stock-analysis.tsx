import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StockAnalysisProps {
  ticker: string
  content: string
}

export function StockAnalysis({ ticker, content }: StockAnalysisProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">{ticker.toUpperCase()} Analysis</CardTitle>
        <CardDescription>Generated financial analysis based on public data</CardDescription>
      </CardHeader>
      <CardContent className="prose prose-sm dark:prose-invert max-w-none">
        {content}
      </CardContent>
    </Card>
  )
}

