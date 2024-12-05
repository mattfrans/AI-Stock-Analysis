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

interface StockData {
  historicalPrices: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  technicalIndicators: {
    ma50: Array<number>;
    ma200: Array<number>;
    volatility: Array<number>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function FinancialCharts({ incomeData, balanceSheet, historicalPrices, metrics }: FinancialChartsProps) {
  // Format quarterly income data
  const quarterlyData = incomeData.quarterlyReports.slice(0, 8).map(report => ({
    quarter: report.fiscalDateEnding.slice(0, 7),
    Revenue: parseFloat(report.totalRevenue),
    'Net Income': parseFloat(report.netIncome),
    'Operating Income': parseFloat(report.operatingIncome),
  })).reverse();

  // Format balance sheet data
  const latestBalance = balanceSheet.quarterlyReports[0];
  const balanceData = [
    {
      name: 'Total Assets',
      value: parseFloat(latestBalance.totalAssets) || 0
    },
    {
      name: 'Total Liabilities',
      value: parseFloat(latestBalance.totalLiabilities) || 0
    },
    {
      name: 'Shareholder Equity',
      value: parseFloat(latestBalance.totalShareholderEquity) || 0
    }
  ];

  // Format stock price data
  const weeklyPrices = historicalPrices.filter((_, index) => index % 5 === 0);

  // Function to check if date is start of a year
  const isStartOfYear = (date: string) => {
    const d = new Date(date);
    return d.getMonth() === 0 && d.getDate() <= 7; // First week of the year
  };

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
          <AreaChart data={weeklyPrices}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45}
              textAnchor="end"
              height={60}
              tickFormatter={(date) => {
                const d = new Date(date);
                return d.getFullYear().toString();
              }}
              ticks={weeklyPrices
                .filter(item => isStartOfYear(item.date))
                .map(item => item.date)
              }
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#0ea5e9"
              fillOpacity={1}
              fill="url(#colorPrice)"
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
          <BarChart data={balanceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number"
              tickFormatter={(value) => `$${(value / 1e9).toFixed(1)}B`}
            />
            <YAxis 
              type="category" 
              dataKey="name"
              width={120}
            />
            <Tooltip 
              formatter={(value: number) => [`$${(value / 1e9).toFixed(2)}B`, 'Amount']}
            />
            <Bar dataKey="value" fill="#0ea5e9" />
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

function VolumeChart({ data }: { data: StockData }) {
  const weeklyPrices = data.historicalPrices.filter((_, index) => index % 5 === 0);
  const isStartOfYear = (date: string) => {
    const d = new Date(date);
    return d.getMonth() === 0 && d.getDate() <= 7;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Trading Volume</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyPrices}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tickFormatter={(date) => new Date(date).getFullYear().toString()}
              ticks={weeklyPrices
                .filter(item => isStartOfYear(item.date))
                .map(item => item.date)
              }
            />
            <YAxis 
              tickFormatter={(value) => (value / 1000000).toFixed(0) + 'M'}
            />
            <Tooltip
              formatter={(value: number) => [
                (value / 1000000).toFixed(2) + 'M',
                'Volume'
              ]}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Bar dataKey="volume" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MovingAveragesChart({ data }: { data: StockData }) {
  const weeklyPrices = data.historicalPrices.filter((_, index) => index % 5 === 0);
  const ma50 = data.technicalIndicators.ma50.filter((_, index) => index % 5 === 0);
  const ma200 = data.technicalIndicators.ma200.filter((_, index) => index % 5 === 0);
  
  const chartData = weeklyPrices.map((price, index) => ({
    date: price.date,
    price: price.close,
    ma50: ma50[index],
    ma200: ma200[index]
  }));

  const isStartOfYear = (date: string) => {
    const d = new Date(date);
    return d.getMonth() === 0 && d.getDate() <= 7;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Moving Averages</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tickFormatter={(date) => new Date(date).getFullYear().toString()}
              ticks={chartData
                .filter(item => isStartOfYear(item.date))
                .map(item => item.date)
              }
            />
            <YAxis 
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            <Line type="monotone" dataKey="price" stroke="#0ea5e9" name="Price" dot={false} />
            <Line type="monotone" dataKey="ma50" stroke="#10b981" name="50-day MA" dot={false} />
            <Line type="monotone" dataKey="ma200" stroke="#ef4444" name="200-day MA" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function VolatilityChart({ data }: { data: StockData }) {
  const weeklyData = data.technicalIndicators.volatility.filter((_, index) => index % 5 === 0);
  const weeklyDates = data.historicalPrices.filter((_, index) => index % 5 === 0).map(p => p.date);
  
  const chartData = weeklyDates.map((date, index) => ({
    date,
    volatility: weeklyData[index]
  }));

  const isStartOfYear = (date: string) => {
    const d = new Date(date);
    return d.getMonth() === 0 && d.getDate() <= 7;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">20-Day Volatility</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tickFormatter={(date) => new Date(date).getFullYear().toString()}
              ticks={chartData
                .filter(item => isStartOfYear(item.date))
                .map(item => item.date)
              }
            />
            <YAxis 
              tickFormatter={(value) => `${value?.toFixed(2)}%`}
            />
            <Tooltip
              formatter={(value: number) => [`${value?.toFixed(2)}%`, 'Volatility']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Area 
              type="monotone" 
              dataKey="volatility" 
              stroke="#9333ea" 
              fill="#9333ea"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StockPriceHistory({ data }: { data: StockData }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Stock Price History</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data.historicalPrices}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.split('-')[0]}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#8884d8"
              dot={false}
              name="Closing Price"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export { FinancialCharts, VolumeChart, MovingAveragesChart, VolatilityChart, StockPriceHistory };
