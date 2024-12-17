import { SentimentData, SocialPost } from '../types';
import { analyzeFinancialContext } from './localSentiment';

// StockTwits API endpoint
const STOCKTWITS_API = 'https://api.stocktwits.com/api/2';
// Reddit API endpoint
const REDDIT_API = 'https://www.reddit.com';

export async function getStockTwitsSentiment(symbol: string): Promise<SocialPost[]> {
  try {
    const response = await fetch(`${STOCKTWITS_API}/streams/symbol/${symbol}.json`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch StockTwits data');
    }

    return data.messages.map((message: any) => ({
      platform: 'stocktwits',
      content: message.body,
      sentiment: message.entities?.sentiment?.basic || 'neutral',
      timestamp: new Date(message.created_at).getTime(),
      author: message.user.username,
      likes: message.likes?.total || 0,
      url: message.links?.web || null
    }));
  } catch (error) {
    console.error('StockTwits API error:', error);
    return [];
  }
}

export async function getRedditSentiment(symbol: string): Promise<SocialPost[]> {
  try {
    // Search both stocks and wallstreetbets subreddits
    const subreddits = ['stocks', 'wallstreetbets'];
    const posts: SocialPost[] = [];

    for (const subreddit of subreddits) {
      const response = await fetch(
        `${REDDIT_API}/r/${subreddit}/search.json?q=${symbol}&restrict_sr=on&sort=new&limit=25`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch Reddit data');
      }

      const redditPosts = data.data.children.map((post: any) => ({
        platform: 'reddit',
        content: post.data.title + (post.data.selftext ? ` ${post.data.selftext}` : ''),
        sentiment: 'neutral', // We'll analyze this with our local sentiment analyzer
        timestamp: post.data.created_utc * 1000,
        author: post.data.author,
        likes: post.data.score,
        url: `https://reddit.com${post.data.permalink}`
      }));

      posts.push(...redditPosts);
    }

    return posts;
  } catch (error) {
    console.error('Reddit API error:', error);
    return [];
  }
}

export async function analyzeSentimentLocally(posts: SocialPost[]): Promise<SocialPost[]> {
  return posts.map(post => ({
    ...post,
    sentiment: analyzeFinancialContext(post.content).sentiment
  }));
}

export async function aggregateSentiment(posts: SocialPost[]): Promise<SentimentData> {
  const sentimentCounts = {
    positive: 0,
    negative: 0,
    neutral: 0
  };

  posts.forEach((post) => {
    sentimentCounts[post.sentiment as keyof typeof sentimentCounts]++;
  });

  const total = posts.length;
  
  return {
    overall: total > 0 
      ? (sentimentCounts.positive - sentimentCounts.negative) / total 
      : 0,
    distribution: {
      positive: sentimentCounts.positive,
      negative: sentimentCounts.negative,
      neutral: sentimentCounts.neutral
    },
    total,
    posts: posts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10) // Return top 10 most recent posts
  };
}

export async function getSentimentAnalysis(symbol: string): Promise<SentimentData> {
  try {
    // Fetch data from multiple sources in parallel
    const [stockTwitsPosts, redditPosts] = await Promise.all([
      getStockTwitsSentiment(symbol),
      getRedditSentiment(symbol)
    ]);

    // Combine all posts
    let allPosts = [...stockTwitsPosts, ...redditPosts];

    // Analyze sentiment for posts that don't have it (Reddit posts)
    const postsNeedingAnalysis = allPosts.filter(post => post.sentiment === 'neutral');
    if (postsNeedingAnalysis.length > 0) {
      const analyzedPosts = await analyzeSentimentLocally(postsNeedingAnalysis);
      allPosts = [
        ...stockTwitsPosts,
        ...analyzedPosts
      ];
    }

    // Aggregate and return sentiment data
    return aggregateSentiment(allPosts);
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return {
      overall: 0,
      distribution: { positive: 0, negative: 0, neutral: 0 },
      total: 0,
      posts: []
    };
  }
}
