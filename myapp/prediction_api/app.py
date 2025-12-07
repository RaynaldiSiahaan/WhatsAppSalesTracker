#!/usr/bin/env python3
"""
Lightweight Prediction API for UMKM Sales Forecasting
Menggunakan model LightGBM dari umkm_forecast.pkl
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)  # Enable CORS for Flutter app

# Load model
MODEL_PATH = '../lib/models/umkm_forecast.pkl'
model = None

def load_model():
    """Load the LightGBM model"""
    global model
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        print(f"✓ Model loaded successfully from {MODEL_PATH}")
        return True
    except Exception as e:
        print(f"✗ Error loading model: {e}")
        return False

def calculate_ewm(values, span=7):
    """Calculate Exponential Weighted Moving Average"""
    if len(values) == 0:
        return 0
    alpha = 2 / (span + 1)
    result = values[0]
    for val in values[1:]:
        result = alpha * val + (1 - alpha) * result
    return result

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'UMKM Sales Forecasting API',
        'model_loaded': model is not None,
        'version': '1.0.0'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Prediction endpoint

    Request body:
    {
        "outlet_id": 1,
        "product_id": 1,
        "historical_sales": [
            {"date": "2024-01-01", "quantity": 5},
            {"date": "2024-01-02", "quantity": 3},
            ...
        ],
        "days": 3
    }

    Response:
    {
        "forecasts": [
            {"date": "2024-01-08", "forecast": 7},
            {"date": "2024-01-09", "forecast": 8},
            {"date": "2024-01-10", "forecast": 6}
        ]
    }
    """
    try:
        data = request.json

        # Validate input
        if not data or 'historical_sales' not in data:
            return jsonify({'error': 'Missing historical_sales'}), 400

        outlet_id = data.get('outlet_id', 1)
        product_id = data.get('product_id', 1)
        historical_sales = data['historical_sales']
        days = data.get('days', 3)

        # Validate minimum data
        if len(historical_sales) < 7:
            return jsonify({
                'error': 'Need at least 7 days of historical data',
                'provided': len(historical_sales)
            }), 400

        # Sort by date
        historical_sales.sort(key=lambda x: x['date'])

        # Extract quantities
        quantities = [float(sale['quantity']) for sale in historical_sales]

        # Get last date
        last_date = datetime.fromisoformat(historical_sales[-1]['date'].replace('Z', '+00:00'))

        # Generate forecasts
        forecasts = []
        historical_values = list(quantities[-7:])  # Last 7 values

        for day in range(1, days + 1):
            forecast_date = last_date + timedelta(days=day)

            # Prepare features (same as training)
            lag_1 = historical_values[-1] if len(historical_values) >= 1 else 0
            lag_3 = historical_values[-3] if len(historical_values) >= 3 else 0
            lag_7 = historical_values[-7] if len(historical_values) >= 7 else 0

            last_3 = historical_values[-3:] if len(historical_values) >= 3 else historical_values
            last_7 = historical_values[-7:] if len(historical_values) >= 7 else historical_values

            rolling_mean_3 = np.mean(last_3) if len(last_3) > 0 else 0
            rolling_mean_7 = np.mean(last_7) if len(last_7) > 0 else 0
            rolling_std_3 = np.std(last_3) if len(last_3) >= 2 else 0

            ewm_7 = calculate_ewm(historical_values, span=7)

            day_of_week = forecast_date.weekday()  # 0=Monday, 6=Sunday
            is_weekend = 1.0 if day_of_week >= 5 else 0.0

            # Feature vector (must match training order)
            features = [
                outlet_id,
                product_id,
                lag_1,
                lag_3,
                lag_7,
                rolling_mean_3,
                rolling_mean_7,
                rolling_std_3,
                ewm_7,
                day_of_week,
                is_weekend,
                forecast_date.day,
                forecast_date.month
            ]

            # Predict using model
            if model is not None:
                prediction = model.predict([features])[0]
            else:
                # Fallback: simple EWM
                prediction = ewm_7

            # Ensure non-negative
            forecast_value = max(0, int(round(prediction)))

            forecasts.append({
                'date': forecast_date.isoformat(),
                'forecast': forecast_value
            })

            # Add prediction to history for next iteration
            historical_values.append(prediction)

        return jsonify({
            'success': True,
            'forecasts': forecasts,
            'model_used': 'lightgbm' if model is not None else 'fallback'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Batch prediction for multiple products"""
    try:
        data = request.json
        products = data.get('products', [])

        results = []
        for product_data in products:
            # Call predict for each product
            # (Implementation similar to /predict)
            pass

        return jsonify({
            'success': True,
            'results': results
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("=" * 50)
    print("UMKM Sales Forecasting API")
    print("=" * 50)

    # Load model
    if not load_model():
        print("\n⚠ Warning: Running without model (will use fallback)")

    print("\nStarting server...")
    print("API URL: http://localhost:5000")
    print("\nEndpoints:")
    print("  GET  /           - Health check")
    print("  POST /predict    - Single prediction")
    print("  POST /batch-predict - Batch predictions")
    print("\nPress Ctrl+C to stop")
    print("=" * 50)

    app.run(host='0.0.0.0', port=5000, debug=False)
