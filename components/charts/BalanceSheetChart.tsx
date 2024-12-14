import React from 'react';
import {
  BarChart,
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

interface BalanceSheetChartProps {
  data: Array<{
    date: string;
    totalAssets?: number;
    totalLiabilities?: number;
    totalEquity?: number;
  }>;
  quarterly?: boolean;
}

export function BalanceSheetChart({ data, quarterly = false }: BalanceSheetChartProps) {
  const chartData = [...data].reverse().map(item => ({
    date: item.date,
    Assets: item.totalAssets,
    Liabilities: item.totalLiabilities,
    Equity: item.totalEquity
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{quarterly ? 'Quarterly' : 'Annual'} Balance Sheet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={(value) => formatLargeNumber(value)}
              />
              <Tooltip 
                formatter={(value: number) => formatLargeNumber(value)}
              />
              <Legend />
              <Bar dataKey="Assets" fill="#8884d8" />
              <Bar dataKey="Liabilities" fill="#82ca9d" />
              <Bar dataKey="Equity" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
