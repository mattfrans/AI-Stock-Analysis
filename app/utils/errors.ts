export class FinancialServiceError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_SYMBOL' | 'NETWORK_ERROR' | 'API_ERROR' | 'DATA_FORMAT_ERROR',
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'FinancialServiceError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof FinancialServiceError) {
    switch (error.code) {
      case 'INVALID_SYMBOL':
        return 'Invalid stock symbol. Please check the symbol and try again.';
      case 'NETWORK_ERROR':
        return 'Unable to connect to the financial data service. Please check your internet connection.';
      case 'API_ERROR':
        return 'The financial data service is currently unavailable. Please try again later.';
      case 'DATA_FORMAT_ERROR':
        return 'Unable to process the financial data. The stock might be delisted or temporarily unavailable.';
      default:
        return error.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
