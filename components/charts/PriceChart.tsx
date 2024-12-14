'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatLargeNumber } from '@/lib/utils'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface PriceChartProps {
  data: {
    date: string
    price: number
  }[]
}

export function PriceChart({ data }: PriceChartProps) {
  if (!data || data.length === 0) {
    return null
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Stock Price History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${formatLargeNumber(value)}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Date
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {new Date(payload[0].payload.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Price
                            </span>
                            <span className="font-bold">
                              ${formatLargeNumber(payload[0].value as number)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                strokeWidth={2}
                activeDot={{
                  r: 4,
                  style: { fill: 'var(--theme-primary)' },
                }}
                style={{
                  stroke: 'var(--theme-primary)',
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
