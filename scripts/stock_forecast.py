import yfinance as yf
import pandas as pd
from prophet import Prophet
import plotly.graph_objects as go
from datetime import datetime
import sys
import json
import os

def generate_stock_forecast(ticker):
    # Download stock data
    stock_data = yf.download(ticker, start='2018-01-01', end=datetime.now().strftime('%Y-%m-%d'))
    
    # Prepare the data for Prophet
    data_for_prophet = stock_data[['Close']].reset_index()
    data_for_prophet.columns = ['ds', 'y']
    
    # Initialize and fit the Prophet model
    model = Prophet(
        changepoint_prior_scale=0.05,  # More flexible trend changes
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False
    )
    model.fit(data_for_prophet)
    
    # Create future dates dataframe (forecasting 1 year ahead)
    future = model.make_future_dataframe(periods=365)
    
    # Generate the forecast
    forecast = model.predict(future)
    
    # Create an interactive plot using plotly
    fig = go.Figure()
    
    # Add actual values
    fig.add_trace(go.Scatter(
        x=data_for_prophet['ds'],
        y=data_for_prophet['y'],
        name='Historical',
        line=dict(color='blue')
    ))
    
    # Add forecasted values
    fig.add_trace(go.Scatter(
        x=forecast['ds'],
        y=forecast['yhat'],
        name='Forecast',
        line=dict(color='red')
    ))
    
    # Add confidence interval
    fig.add_trace(go.Scatter(
        x=forecast['ds'].tolist() + forecast['ds'].tolist()[::-1],
        y=forecast['yhat_upper'].tolist() + forecast['yhat_lower'].tolist()[::-1],
        fill='toself',
        fillcolor='rgba(255,0,0,0.2)',
        line=dict(color='rgba(255,255,255,0)'),
        name='Confidence Interval'
    ))
    
    # Update layout
    fig.update_layout(
        title=f'{ticker} Historical Data and Forecast',
        xaxis_title='Date',
        yaxis_title='Price',
        showlegend=True,
        template='plotly_white'
    )
    
    # Create public directory if it doesn't exist
    os.makedirs('public/forecasts', exist_ok=True)
    
    # Save the plot to an HTML file
    html_path = f'public/forecasts/{ticker.lower()}_forecast.html'
    fig.write_html(html_path)
    
    # Prepare the forecast data for the next 30 days
    forecast_data = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(30).to_dict('records')
    formatted_forecast = [
        {
            'date': row['ds'].strftime('%Y-%m-%d'),
            'predicted': round(row['yhat'], 2),
            'lower_bound': round(row['yhat_lower'], 2),
            'upper_bound': round(row['yhat_upper'], 2)
        }
        for row in forecast_data
    ]
    
    # Prepare the result
    result = {
        'forecast': formatted_forecast,
        'latestValue': float(data_for_prophet['y'].iloc[-1]),
        'htmlPath': html_path.replace('public/', '/')
    }
    
    return result

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({'error': 'Please provide a ticker symbol'}))
        sys.exit(1)
        
    ticker = sys.argv[1]
    try:
        result = generate_stock_forecast(ticker)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
