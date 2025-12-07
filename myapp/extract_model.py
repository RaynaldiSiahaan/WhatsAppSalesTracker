#!/usr/bin/env python3
"""
Extract LightGBM model from pickle file and convert to Dart implementation
"""
import pickle
import json
import os

def extract_model(pkl_path):
    """Extract model parameters from pickle file"""
    print(f"Loading model from {pkl_path}...")

    with open(pkl_path, 'rb') as f:
        model = pickle.load(f)

    print(f"Model type: {type(model)}")
    print(f"Model class: {model.__class__.__name__}")

    # Check if it's a LightGBM model
    if hasattr(model, 'booster_'):
        print("LightGBM Booster detected")
        booster = model.booster_

        # Get model info
        model_dict = booster.dump_model()

        print(f"\nModel Info:")
        print(f"  Objective: {model_dict.get('objective', 'N/A')}")
        print(f"  Num trees: {len(model_dict.get('tree_info', []))}")
        print(f"  Num features: {model_dict.get('max_feature_idx', 0) + 1}")

        # Save model to JSON for inspection
        json_path = pkl_path.replace('.pkl', '_model.json')
        with open(json_path, 'w') as f:
            json.dump(model_dict, f, indent=2)
        print(f"\nModel structure saved to: {json_path}")

        # Generate Dart implementation
        generate_dart_implementation(model_dict, pkl_path)

    elif hasattr(model, 'estimators_'):
        print("Ensemble model detected (like RandomForest or GradientBoosting)")
        print(f"Number of estimators: {len(model.estimators_)}")

    else:
        print("Unknown model type")
        print(f"Available attributes: {dir(model)}")

def generate_dart_implementation(model_dict, pkl_path):
    """Generate Dart code for the model"""
    dart_path = pkl_path.replace('.pkl', '_dart.dart')

    num_trees = len(model_dict.get('tree_info', []))
    num_features = model_dict.get('max_feature_idx', 0) + 1

    dart_code = f'''// Auto-generated from {os.path.basename(pkl_path)}
// DO NOT EDIT MANUALLY

import 'dart:math';

class LightGBMModel {{
  // Model configuration
  static const int numTrees = {num_trees};
  static const int numFeatures = {num_features};
  static const String objective = "{model_dict.get('objective', 'regression')}";

  // Predict using the LightGBM model
  static double predict(List<double> features) {{
    if (features.length != numFeatures) {{
      throw ArgumentError('Expected $numFeatures features, got ${{features.length}}');
    }}

    double prediction = 0.0;

    // Sum predictions from all trees
'''

    # Add tree predictions
    trees = model_dict.get('tree_info', [])
    for i, tree in enumerate(trees[:min(10, len(trees))]):  # Limit to first 10 trees for now
        dart_code += f"    prediction += _tree{i}(features);\n"

    dart_code += '''
    return prediction;
  }

  // Individual tree prediction functions
'''

    # Generate tree functions (simplified for now)
    for i, tree in enumerate(trees[:min(10, len(trees))]):
        dart_code += f'''
  static double _tree{i}(List<double> features) {{
    // Tree {i} implementation
    // TODO: Implement tree logic
    return 0.0;
  }}
'''

    dart_code += '''}
'''

    with open(dart_path, 'w') as f:
        f.write(dart_code)

    print(f"\nDart implementation template saved to: {dart_path}")
    print("\nNote: Full tree implementation requires parsing the tree structure.")
    print("Consider using a simpler model or API-based approach for production.")

if __name__ == '__main__':
    pkl_path = 'lib/models/umkm_forecast.pkl'

    if not os.path.exists(pkl_path):
        print(f"Error: File not found: {pkl_path}")
        print("\nSearching for .pkl files...")
        import glob
        pkl_files = glob.glob('**/*.pkl', recursive=True)
        if pkl_files:
            print("Found:")
            for f in pkl_files:
                print(f"  {f}")
            pkl_path = pkl_files[0]
            print(f"\nUsing: {pkl_path}")
        else:
            print("No .pkl files found")
            exit(1)

    extract_model(pkl_path)
