#!/usr/bin/env python3
"""
Convert LightGBM pickle model to TensorFlow Lite for mobile deployment
"""
import pickle
import numpy as np
import tensorflow as tf
from tensorflow import keras
import os

def load_lightgbm_model(pkl_path):
    """Load LightGBM model from pickle"""
    print(f"Loading LightGBM model from {pkl_path}...")
    with open(pkl_path, 'rb') as f:
        model = pickle.load(f)
    print(f"[OK] Model loaded: {model.__class__.__name__}")
    return model

def create_keras_approximation(lgbm_model, num_features=13):
    """
    Create a Keras neural network that approximates the LightGBM model
    This is a distillation approach - train a simpler NN to mimic LGBM
    """
    print("\nCreating Neural Network approximation...")

    # Generate synthetic training data from LightGBM model
    print("Generating synthetic training data...")
    np.random.seed(42)

    # Create feature ranges based on typical sales data
    n_samples = 10000
    X_synthetic = np.random.rand(n_samples, num_features)

    # Scale features to realistic ranges
    X_synthetic[:, 0] = np.random.randint(1, 10, n_samples)  # outlet_id
    X_synthetic[:, 1] = np.random.randint(1, 50, n_samples)  # product_id
    X_synthetic[:, 2:9] = X_synthetic[:, 2:9] * 20  # quantity-related features
    X_synthetic[:, 9] = np.random.randint(0, 7, n_samples)  # day_of_week
    X_synthetic[:, 10] = (X_synthetic[:, 9] >= 5).astype(float)  # is_weekend
    X_synthetic[:, 11] = np.random.randint(1, 32, n_samples)  # day
    X_synthetic[:, 12] = np.random.randint(1, 13, n_samples)  # month

    # Get predictions from LightGBM
    print("Getting LightGBM predictions...")
    y_synthetic = lgbm_model.predict(X_synthetic)

    # Create and train Keras model
    print("\nBuilding Neural Network...")
    model = keras.Sequential([
        keras.layers.Input(shape=(num_features,)),
        keras.layers.Dense(128, activation='relu'),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dense(1, activation='linear')
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae']
    )

    print("\nTraining Neural Network to approximate LightGBM...")
    print("This may take a few minutes...")
    history = model.fit(
        X_synthetic, y_synthetic,
        epochs=50,
        batch_size=128,
        validation_split=0.2,
        verbose=0  # Disable progress bar to avoid encoding issues
    )
    print("Training epochs completed!")

    # Evaluate approximation quality
    final_loss = history.history['val_loss'][-1]
    final_mae = history.history['val_mae'][-1]
    print(f"\n[OK] Training complete!")
    print(f"  Validation Loss (MSE): {final_loss:.4f}")
    print(f"  Validation MAE: {final_mae:.4f}")

    return model

def convert_to_tflite(keras_model, output_path):
    """Convert Keras model to TensorFlow Lite"""
    print(f"\nConverting to TensorFlow Lite...")

    # Convert to TFLite
    converter = tf.lite.TFLiteConverter.from_keras_model(keras_model)

    # Optimization for mobile
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]  # Use FP16 for smaller size

    tflite_model = converter.convert()

    # Save model
    with open(output_path, 'wb') as f:
        f.write(tflite_model)

    # Get model size
    size_kb = len(tflite_model) / 1024
    print(f"[OK] TFLite model saved to: {output_path}")
    print(f"  Model size: {size_kb:.2f} KB")

    return tflite_model

def test_tflite_model(tflite_path, keras_model, num_features=13):
    """Test the TFLite model"""
    print(f"\nTesting TFLite model...")

    # Load TFLite model
    interpreter = tf.lite.Interpreter(model_path=tflite_path)
    interpreter.allocate_tensors()

    # Get input and output details
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # Generate test data
    test_data = np.random.rand(1, num_features).astype(np.float32)

    # Keras prediction
    keras_pred = keras_model.predict(test_data, verbose=0)[0][0]

    # TFLite prediction
    interpreter.set_tensor(input_details[0]['index'], test_data)
    interpreter.invoke()
    tflite_pred = interpreter.get_tensor(output_details[0]['index'])[0][0]

    # Compare
    diff = abs(keras_pred - tflite_pred)
    print(f"  Keras prediction: {keras_pred:.4f}")
    print(f"  TFLite prediction: {tflite_pred:.4f}")
    print(f"  Difference: {diff:.4f}")

    if diff < 0.1:
        print("[OK] TFLite model works correctly!")
        return True
    else:
        print("[WARN] Warning: Large difference between Keras and TFLite")
        return False

def main():
    """Main conversion pipeline"""
    print("=" * 60)
    print("LightGBM to TensorFlow Lite Converter")
    print("=" * 60)

    # Paths
    pkl_path = 'lib/models/umkm_forecast.pkl'
    tflite_path = 'lib/models/umkm_forecast.tflite'

    # Check if pickle file exists
    if not os.path.exists(pkl_path):
        print(f"[ERROR] Error: {pkl_path} not found")
        return

    # Load LightGBM model
    lgbm_model = load_lightgbm_model(pkl_path)

    # Create Keras approximation
    keras_model = create_keras_approximation(lgbm_model)

    # Convert to TFLite
    convert_to_tflite(keras_model, tflite_path)

    # Test TFLite model
    test_tflite_model(tflite_path, keras_model)

    print("\n" + "=" * 60)
    print("[OK] Conversion Complete!")
    print("=" * 60)
    print(f"\nNext steps:")
    print(f"1. Copy {tflite_path} to your Flutter assets")
    print(f"2. Add to pubspec.yaml:")
    print(f"   assets:")
    print(f"     - {tflite_path}")
    print(f"3. Update ML service to use TFLite")
    print(f"   (See ml_service_tflite.dart)")

if __name__ == '__main__':
    # Install requirements
    print("Checking dependencies...")
    try:
        import tensorflow
        import lightgbm
        print("[OK] All dependencies installed")
    except ImportError as e:
        print(f"[ERROR] Missing dependency: {e}")
        print("\nInstall with:")
        print("  pip install tensorflow lightgbm numpy scikit-learn")
        exit(1)

    main()
