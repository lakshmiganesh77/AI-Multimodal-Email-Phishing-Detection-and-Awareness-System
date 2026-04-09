import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb
import joblib
from url_features import extract_url_features, FEATURE_NAMES

def get_dataset_path():
    """Identify which dataset to load from the data folder."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "..", "data")
    potential_datasets = [
        os.path.join(data_dir, 'PhiUSIIL_Phishing_URL_Dataset.csv'),
        os.path.join(data_dir, 'urls.csv'), 
        os.path.join(data_dir, 'phishing_site_urls.csv'), 
        os.path.join(data_dir, 'synth_url_dataset.csv')
    ]
    for ds in potential_datasets:
        if os.path.exists(ds):
            return ds
    return None

def train_model():
    dataset_path = get_dataset_path()
    if not dataset_path:
        print("Error: No URL dataset found! Tried urls.csv, phishing_site_urls.csv, and synth_url_dataset.csv")
        return

    print(f"Loading dataset from: {dataset_path}...")
    try:
        df = pd.read_csv(dataset_path)
    except Exception as e:
        print(f"Failed to read dataset: {e}")
        return
        
    # Standardize column names (Kaggle datasets vary wildly)
    column_mapping = {
        'URL': 'url',
        'Url': 'url',
        'target': 'label',
        'Class': 'label',
        'Status': 'label'
    }
    df.rename(columns=column_mapping, inplace=True)
    
    # Handle text labels (e.g., 'bad', 'good')
    if 'label' in df.columns:
        if df['label'].dtype == 'O': # Object/String
            df['label'] = df['label'].apply(lambda x: 1 if str(x).lower() in ['bad', 'phishing', 'malicious', '1'] else 0)
    else:
        print("Error: Could not find a suitable 'label' column in the dataset.")
        print(f"Available columns: {list(df.columns)}")
        return

    try:
        print("DEBUG: Checking URL columns...")
        if 'url' not in df.columns:
             print("Error: Could not find a suitable 'url' column in the dataset.")
             print(f"Available columns: {list(df.columns)}")
             return
             
        # Limit dataset size to avoid MemoryErrors on huge Kaggle datasets
        max_samples = 50000
        print(f"DEBUG: Dataset row count: {len(df)}")
        if len(df) > max_samples:
             print(f"Dataset is huge ({len(df)} rows). Sampling {max_samples} for faster training...")
             df = df.sample(n=max_samples, random_state=42)
        
        print(f"Extracting features from {len(df)} URLs (This might take a minute)...")
        # Apply feature extraction to every URL iteratively to avoid memory spikes
        print("DEBUG: Starting iterative mapping...")
        featuresList = []
        url_list = df['url'].astype(str).tolist()
        total_urls = len(url_list)
        for i, url in enumerate(url_list):
            if i % 5000 == 0:
                print(f"DEBUG: Processed {i} / {total_urls} URLs...")
            featuresList.append(extract_url_features(url))
        print(f"DEBUG: Processed {total_urls} / {total_urls} URLs.")
        print("DEBUG: Apply mapping finished.")
        
        print("DEBUG: Creating DataFrame features...")
        X = pd.DataFrame(featuresList, columns=FEATURE_NAMES)
        y = df['label']
        
        print("Splitting data...")
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print("Training XGBoost URL Classifier...")
        print("DEBUG: Init XGBoost...")
        model = xgb.XGBClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42,
            use_label_encoder=False,
            eval_metric='logloss'
        )
        
        print("DEBUG: Calling model.fit...")
        model.fit(X_train, y_train)
        print("DEBUG: model.fit finished.")
        
        print("Evaluating model...")
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"Accuracy: {accuracy * 100:.2f}%")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        print("Saving model to models/xgb_url_model.joblib...")
        models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models")
        os.makedirs(models_dir, exist_ok=True)
        joblib.dump(model, os.path.join(models_dir, 'xgb_url_model.joblib'))
        print("Training complete!")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CRITICAL ERROR in training logic: {e}")

if __name__ == '__main__':
    train_model()
