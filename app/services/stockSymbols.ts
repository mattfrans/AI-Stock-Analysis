export interface StockSymbol {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
  matchScore: string;
}

export async function searchStockSymbols(query: string): Promise<StockSymbol[]> {
  if (!query || query.length < 1) return [];

  try {
    console.log('Searching for:', query);
    const response = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search stocks');
    }

    const { results } = await response.json();
    return results;
  } catch (error) {
    console.error('Error searching stock symbols:', error);
    throw error;
  }
}
