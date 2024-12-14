import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLargeNumber } from '@/lib/utils';

interface CashFlowChartProps {
  data: Array<{
    date: string;
    freeCashFlow?: number;
    operatingIncome?: number;
  }>;
  quarterly?: boolean;
}

export function CashFlowChart({ data, quarterly = false }: CashFlowChartProps) {
  const chartData = [...data].reverse().map(item => ({
    date: item.date,
    'Free Cash Flow': item.freeCashFlow,
    'Operating Income': item.operatingIncome
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{quarterly ? 'Quarterly' : 'Annual'} Cash Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                tickFormatter={(value) => formatLargeNumber(value)}
              />
              <Tooltip 
                formatter={(value: number) => formatLargeNumber(value)}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="Free Cash Flow" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="Operating Income" 
                stackId="1"
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
