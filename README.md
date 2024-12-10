# AI Stock Analyzer

An intelligent stock analysis tool powered by Claude AI that provides comprehensive financial analysis for any publicly traded company.

## Features

- Real-time stock analysis using Claude AI (claude-3-opus-20240229)
- Comprehensive financial data from multiple sources:
  - Company fundamentals from Alpha Vantage
  - Real-time and historical prices from Yahoo Finance
  - AI-powered analysis from Claude
- Interactive financial charts using Recharts:
  - Stock Price History
  - Quarterly Performance
  - Balance Sheet Overview
  - Key Performance Metrics
- Stock forecast using Prophet
- Clean, modern UI built with Next.js 14 and Tailwind CSS

## Tech Stack

- **Frontend Framework**: Next.js 14
- **Styling**: Tailwind CSS with shadcn/ui components
- **AI Integration**: Anthropic's Claude API (claude-3-opus-20240229)
- **Data Sources**: 
  - Alpha Vantage API (fundamentals)
  - Yahoo Finance API (price data)
- **Charting**: Recharts
- **Language**: TypeScript

## Data Integration

The app uses multiple data sources to provide comprehensive analysis:

1. **Alpha Vantage API** (requires API key):
   - Company Overview
   - Income Statements
   - Balance Sheets
   - Rate Limits: 5 calls/minute, 500 calls/day

2. **Yahoo Finance API** (no key required):
   - Real-time stock prices
   - Historical price data
   - Daily time series

3. **Claude AI**:
   - Analyzes financial data
   - Provides insights and recommendations
   - Identifies trends and risks

## Getting Started

### Prerequisites

- Node.js 18+ 
- Anthropic API Key (for Claude AI)
- Alpha Vantage API Key (for financial data)

### Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd stock-analysis
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your API keys:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
DISABLE_AI_ANALYSIS=false (optional)
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter a stock ticker symbol (e.g., "AAPL" for Apple Inc.)
2. Click "Analyze" or press Enter
3. The app will:
   - Fetch real-time price data from Yahoo Finance
   - Retrieve fundamental data from Alpha Vantage
   - Generate AI analysis using Claude
   - Display interactive charts and insights

## Rate Limits and Caching

- **Alpha Vantage API Limits**:
  - 5 API calls per minute
  - 500 API calls per day
  - Each stock analysis uses 3 calls (overview, income, balance)

- **Yahoo Finance**:
  - No rate limits
  - Used for real-time and historical prices
  - More reliable for price data

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
