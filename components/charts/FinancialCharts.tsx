import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface FinancialMetric {
  name: string;
  value: number;
}

interface FinancialChartsProps {
  incomeData: any;
  balanceSheet: any;
  historicalPrices: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  metrics: {
    profitMargin: number;
    peRatio: number;
    dividendYield: number;
    beta: number;
    earningsGrowth: number;
    revenueGrowth: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function FinancialCharts({ incomeData, balanceSheet, historicalPrices, metrics }: FinancialChartsProps) {
  // Format quarterly income data
  const quarterlyData = incomeData.quarterlyReports.slice(0, 8).map(report => ({
    quarter: report.fiscalDateEnding.slice(0, 7),
    Revenue: parseFloat(report.totalRevenue),
    'Net Income': parseFloat(report.netIncome),
    'Operating Income': parseFloat(report.operatingIncome),
  })).reverse();

  // Format balance sheet data
  const balanceSheetMetrics = [
    {
      name: 'Total Assets',
      value: parseFloat(balanceSheet.totalAssets)
    },
    {
      name: 'Total Liabilities',
      value: parseFloat(balanceSheet.totalLiabilities)
    },
    {
      name: 'Shareholder Equity',
      value: parseFloat(balanceSheet.totalShareholderEquity)
    }
  ];

  // Format stock price data
  const stockPriceData = historicalPrices.map(price => ({
    date: price.date,
    Price: price.close,
    Volume: price.volume
  }));

  // Key performance metrics
  const performanceMetrics = [
    { name: 'Profit Margin', value: metrics.profitMargin },
    { name: 'P/E Ratio', value: metrics.peRatio },
    { name: 'Dividend Yield', value: metrics.dividendYield },
    { name: 'Beta', value: metrics.beta },
    { name: 'Earnings Growth', value: metrics.earningsGrowth },
    { name: 'Revenue Growth', value: metrics.revenueGrowth }
  ];

  const formatLargeNumber = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Stock Price Chart */}
      <div className="bg-white rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Stock Price History</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={stockPriceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
              interval={Math.ceil(stockPriceData.length / 10)}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
              formatter={(value: number) => ['$' + value.toFixed(2), 'Price']}
            />
            <Legend />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="Price" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quarterly Revenue and Income */}
      <div className="bg-white rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Quarterly Performance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={quarterlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quarter" />
            <YAxis tickFormatter={formatLargeNumber} />
            <Tooltip formatter={(value: number) => formatLargeNumber(value)} />
            <Legend />
            <Line type="monotone" dataKey="Revenue" stroke="#8884d8" />
            <Line type="monotone" dataKey="Net Income" stroke="#82ca9d" />
            <Line type="monotone" dataKey="Operating Income" stroke="#ffc658" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Balance Sheet */}
      <div className="bg-white rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Balance Sheet Overview</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={balanceSheetMetrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatLargeNumber} />
            <Tooltip formatter={(value: number) => formatLargeNumber(value)} />
            <Bar dataKey="value" fill="#8884d8">
              {balanceSheetMetrics.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Key Performance Metrics */}
      <div className="bg-white rounded-lg">
        <h3 className="text-sm font-semibold mb-2">Key Performance Metrics</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={performanceMetrics} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip formatter={(value: number) => value.toFixed(2)} />
            <Bar dataKey="value" fill="#8884d8">
              {performanceMetrics.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
