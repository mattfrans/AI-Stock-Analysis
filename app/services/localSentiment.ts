// Financial-specific positive and negative word dictionaries
const POSITIVE_WORDS = new Set([
  // Market sentiment
  'bullish', 'uptrend', 'breakout', 'outperform', 'buy', 'long',
  'growth', 'profit', 'gain', 'positive', 'upgrade', 'strong',
  'surge', 'rally', 'recover', 'climb', 'beat', 'exceed',
  'momentum', 'opportunity', 'promising', 'confident', 'robust',
  'innovative', 'leadership', 'successful', 'efficient', 'advantage',
  
  // Financial metrics
  'revenue', 'earnings', 'profit', 'dividend', 'buyback',
  'margin', 'growth', 'cash', 'value', 'assets',
]);

const NEGATIVE_WORDS = new Set([
  // Market sentiment
  'bearish', 'downtrend', 'breakdown', 'underperform', 'sell', 'short',
  'loss', 'negative', 'downgrade', 'weak', 'decline', 'drop',
  'fall', 'crash', 'bear', 'risk', 'debt', 'miss', 'below',
  'concern', 'worried', 'cautious', 'volatile', 'uncertainty',
  'problem', 'challenge', 'difficult', 'competition', 'pressure',
  
  // Financial metrics
  'debt', 'liability', 'expense', 'cost', 'loss',
  'deficit', 'bankruptcy', 'default', 'restructuring', 'layoff',
]);

// Intensity modifiers that can strengthen or weaken sentiment
const INTENSITY_MODIFIERS = new Map([
  ['very', 1.5],
  ['highly', 1.5],
  ['extremely', 2],
  ['significantly', 1.5],
  ['substantially', 1.5],
  ['slightly', 0.5],
  ['somewhat', 0.7],
  ['marginally', 0.5],
  ['not', -1],
  ["n't", -1],
  ['never', -1],
]);

interface SentimentScore {
  score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export function analyzeSentiment(text: string): SentimentScore {
  // Convert to lowercase and split into words
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  let score = 0;
  let multiplier = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check for intensity modifiers
    if (INTENSITY_MODIFIERS.has(word)) {
      multiplier *= INTENSITY_MODIFIERS.get(word)!;
      continue;
    }

    // Check sentiment and apply multiplier
    if (POSITIVE_WORDS.has(word)) {
      score += 1 * multiplier;
      multiplier = 1; // Reset multiplier after applying
    } else if (NEGATIVE_WORDS.has(word)) {
      score -= 1 * multiplier;
      multiplier = 1; // Reset multiplier after applying
    }
  }

  // Normalize score to be between -1 and 1
  const normalizedScore = Math.max(-1, Math.min(1, score / Math.max(1, words.length / 10)));

  // Determine sentiment category
  let sentiment: 'positive' | 'negative' | 'neutral';
  if (normalizedScore > 0.1) {
    sentiment = 'positive';
  } else if (normalizedScore < -0.1) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  return {
    score: normalizedScore,
    sentiment
  };
}

// Additional utility functions for context-aware sentiment
export function analyzeFinancialContext(text: string): SentimentScore {
  const baseScore = analyzeSentiment(text);
  
  // Look for specific financial patterns that might override base sentiment
  const pricePatterns = text.match(/\$\d+(\.\d+)?/g) || [];
  const percentagePatterns = text.match(/[-+]?\d+(\.\d+)?%/g) || [];
  
  let contextScore = baseScore.score;

  // Analyze price movements
  percentagePatterns.forEach(pattern => {
    const value = parseFloat(pattern);
    if (!isNaN(value)) {
      if (value > 0) contextScore += 0.2;
      else if (value < 0) contextScore -= 0.2;
    }
  });

  // Normalize final score
  const finalScore = Math.max(-1, Math.min(1, contextScore));

  return {
    score: finalScore,
    sentiment: finalScore > 0.1 ? 'positive' : finalScore < -0.1 ? 'negative' : 'neutral'
  };
}

// Function to analyze a batch of texts
export function batchAnalyzeSentiment(texts: string[]): SentimentScore[] {
  return texts.map(text => analyzeFinancialContext(text));
}
