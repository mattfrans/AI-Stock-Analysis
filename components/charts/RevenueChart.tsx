import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLargeNumber } from '@/lib/utils';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue?: number;
    grossProfit?: number;
    netIncome?: number;
  }>;
  quarterly?: boolean;
}

export function RevenueChart({ data, quarterly = false }: RevenueChartProps) {
  const chartData = [...data].reverse().map(item => ({
    date: item.date,
    Revenue: item.revenue,
    'Gross Profit': item.grossProfit,
    'Net Income': item.netIncome
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{quarterly ? 'Quarterly' : 'Annual'} Revenue Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={(value) => formatLargeNumber(value)}
              />
              <Tooltip 
                formatter={(value: number) => formatLargeNumber(value)}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Revenue" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="Gross Profit" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="Net Income" 
                stroke="#ffc658" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
