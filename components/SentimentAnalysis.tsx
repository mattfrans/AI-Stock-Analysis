import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SentimentData } from '@/app/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface SentimentAnalysisProps {
  symbol: string;
}

export function SentimentAnalysis({ symbol }: SentimentAnalysisProps) {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentiment = async () => {
      if (!symbol) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/stock/sentiment?symbol=${symbol}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch sentiment data');
        }

        setSentiment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
  }, [symbol]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Sentiment Analysis</CardTitle>
          <CardDescription>Loading sentiment data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Sentiment Analysis</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!sentiment) return null;

  const sentimentColor = sentiment.overall > 0.2 
    ? 'bg-green-500' 
    : sentiment.overall < -0.2 
    ? 'bg-red-500' 
    : 'bg-yellow-500';

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Sentiment Analysis</CardTitle>
        <CardDescription>
          Based on {sentiment.total} social media posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Sentiment */}
          <div>
            <h4 className="text-sm font-medium mb-2">Overall Sentiment</h4>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${sentimentColor} transition-all`}
                style={{ 
                  width: `${((sentiment.overall + 1) / 2) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div>
            <h4 className="text-sm font-medium mb-2">Sentiment Distribution</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Positive</span>
                  <span>{sentiment.distribution.positive}</span>
                </div>
                <Progress 
                  value={(sentiment.distribution.positive / sentiment.total) * 100} 
                  className="bg-gray-200"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Neutral</span>
                  <span>{sentiment.distribution.neutral}</span>
                </div>
                <Progress 
                  value={(sentiment.distribution.neutral / sentiment.total) * 100} 
                  className="bg-gray-200"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Negative</span>
                  <span>{sentiment.distribution.negative}</span>
                </div>
                <Progress 
                  value={(sentiment.distribution.negative / sentiment.total) * 100} 
                  className="bg-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Recent Posts */}
          <div>
            <h4 className="text-sm font-medium mb-2">Recent Posts</h4>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-4">
                {sentiment.posts.map((post, index) => (
                  <div 
                    key={index}
                    className="border-b pb-2 last:border-0"
                  >
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                      <span className="flex items-center gap-2">
                        <span className="capitalize">{post.platform}</span>
                        <span>•</span>
                        <span>{post.author}</span>
                      </span>
                      <span>{formatDate(post.timestamp)}</span>
                    </div>
                    <p className="text-sm mb-1">{post.content}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs
                        ${post.sentiment === 'positive' ? 'bg-green-100 text-green-800' : 
                          post.sentiment === 'negative' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {post.sentiment}
                      </span>
                      {post.url && (
                        <a 
                          href={post.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View Post
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
