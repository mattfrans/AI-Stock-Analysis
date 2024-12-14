import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLargeNumber } from '@/lib/utils';

interface FinancialMetricsChartProps {
  data: Array<{
    date: string;
    revenue?: number;
    netIncome?: number;
    ebitda?: number;
  }>;
  quarterly?: boolean;
}

export function FinancialMetricsChart({ data, quarterly = false }: FinancialMetricsChartProps) {
  const chartData = [...data].reverse().map(item => ({
    date: item.date,
    Revenue: item.revenue,
    'Net Income': item.netIncome,
    EBITDA: item.ebitda,
    'Net Margin': item.revenue && item.netIncome 
      ? (item.netIncome / item.revenue) * 100 
      : undefined,
    'EBITDA Margin': item.revenue && item.ebitda 
      ? (item.ebitda / item.revenue) * 100 
      : undefined
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{quarterly ? 'Quarterly' : 'Annual'} Financial Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => formatLargeNumber(value)}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name.includes('Margin')) {
                    return [`${value.toFixed(1)}%`, name];
                  }
                  return [formatLargeNumber(value), name];
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="Revenue" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
              <Bar 
                yAxisId="left"
                dataKey="EBITDA" 
                fill="#82ca9d" 
                fillOpacity={0.6}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="Net Margin" 
                stroke="#ff7300"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="EBITDA Margin" 
                stroke="#387908"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
