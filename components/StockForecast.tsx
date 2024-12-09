import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ForecastData {
  date: string;
  predicted: number;
  lower_bound: number;
  upper_bound: number;
}

interface ForecastResult {
  forecast: ForecastData[];
  latestValue: number;
  htmlPath: string;
}

interface StockForecastProps {
  ticker: string;
}

export function StockForecast({ ticker }: StockForecastProps) {
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      if (!ticker) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/forecast?ticker=${ticker}`);
        if (!response.ok) {
          throw new Error('Failed to fetch forecast');
        }
        const data = await response.json();
        setForecastData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load forecast');
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [ticker]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading forecast...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!forecastData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Price Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-semibold">Latest Value: ${forecastData.latestValue.toFixed(2)}</p>
          </div>
          
          <div className="h-[600px] w-full">
            <iframe
              src={forecastData.htmlPath}
              className="w-full h-full border-0"
              title="Stock Forecast Chart"
            />
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">30-Day Forecast</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Predicted</th>
                    <th className="px-4 py-2">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData.forecast.map((day) => (
                    <tr key={day.date}>
                      <td className="px-4 py-2">{day.date}</td>
                      <td className="px-4 py-2">${day.predicted.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        ${day.lower_bound.toFixed(2)} - ${day.upper_bound.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
