import { spawn } from 'child_process';
import path from 'path';

export interface ForecastResult {
  forecast: {
    date: string;
    predicted: number;
    lower_bound: number;
    upper_bound: number;
  }[];
  latestValue: number;
  htmlPath: string;
}

export async function generateStockForecast(ticker: string): Promise<ForecastResult> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(process.cwd(), 'scripts', 'stock_forecast.py'),
      ticker
    ]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`));
        return;
      }

      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (error) {
        reject(new Error('Failed to parse forecast data'));
      }
    });
  });
}
