# AI Stock Analyzer

An intelligent stock analysis tool powered by Claude AI that provides comprehensive financial analysis for any publicly traded company.

## Features

- Real-time stock analysis using Claude AI
- Clean, modern UI built with Next.js 14 and Tailwind CSS
- Comprehensive financial reports including:
  - Company Overview
  - Financial Health
  - Market Position
  - Risks and Opportunities
  - Future Outlook

## Tech Stack

- **Frontend Framework**: Next.js 14
- **Styling**: Tailwind CSS with shadcn/ui components
- **AI Integration**: Anthropic's Claude API
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- Anthropic API Key

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

3. Create a `.env` file in the root directory and add your Anthropic API key:
```env
ANTHROPIC_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter a stock ticker symbol (e.g., "AAPL" for Apple Inc.)
2. Click "Analyze"
3. View the comprehensive AI-generated analysis

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
