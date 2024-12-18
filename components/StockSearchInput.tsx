import React, { useState } from 'react';
import { Input } from "@/components/ui/input";

interface StockSearchInputProps {
  onStockSelect: (symbol: string) => void;
}

export function StockSearchInput({ onStockSelect }: StockSearchInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Submitting search for:', inputValue.trim());
      const response = await fetch(`/api/stock/search?q=${encodeURIComponent(inputValue.trim())}`);
      console.log('Search response status:', response.status);
      const data = await response.json();
      console.log('Search response data:', data);

      if (!response.ok) {
        if (response.status === 429) {
          setError('API rate limit reached. Please wait a minute before trying again.');
        } else {
          setError(data.error || 'Failed to search for stock');
        }
        return;
      }

      if (data.results && data.results.length > 0) {
        // Use the first result
        onStockSelect(data.results[0].symbol);
        setInputValue('');
      } else {
        setError('No matching stocks found');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search for stock');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter stock symbol (e.g., AAPL)"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          className="flex-1"
          disabled={isLoading}
        />
      </form>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
