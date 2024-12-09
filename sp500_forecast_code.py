# Import necessary libraries
import yfinance as yf
import pandas as pd
from prophet import Prophet
import plotly.graph_objects as go
from datetime import datetime

# Download S&P 500 data
sp500_data = yf.download('^GSPC', start='2018-01-01', end='2024-12-09')

# Prepare the data for Prophet
data_for_prophet = sp500_data[['Close']].reset_index()
data_for_prophet.columns = ['ds', 'y']

# Initialize and fit the Prophet model
model = Prophet()
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
    title='S&P 500 Historical Data and Forecast',
    xaxis_title='Date',
    yaxis_title='Price',
    showlegend=True,
    template='plotly_white'
)

# Save the plot to an HTML file
fig.write_html('sp500_forecast.html')

# Print some key statistics
print("Latest actual S&P 500 value:", data_for_prophet['y'].iloc[-1])
print("\nForecast for next 30 days:")
print(forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(30))
