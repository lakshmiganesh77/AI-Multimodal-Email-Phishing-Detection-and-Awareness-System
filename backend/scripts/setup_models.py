"""
PhishGuard ML Model Setup Script
Downloads and saves the BERT model for phishing detection.

Run this script once to set up the ML models:
    python setup_models.py
"""

import os
import sys

def setup_bert_model():
    """Download and save BERT model for phishing detection"""
    print("=" * 60)
    print("PhishGuard ML Model Setup")
    print("=" * 60)
    
    try:
        print("\n[1/3] Importing transformers library...")
        from transformers import BertTokenizer, BertForSequenceClassification
        print("✓ Transformers library loaded successfully")
    except ImportError:
        print("✗ ERROR: transformers library not found")
        print("\nPlease install it with:")
        print("    pip install transformers torch")
        return False
    
    # Define model path
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(BASE_DIR, "..", "models", "bert_phishing_model")
    
    print(f"\n[2/3] Checking model directory: {model_path}")
    
    if os.path.exists(model_path):
        print(f"✓ Model directory already exists")
        print("\nChecking if model files are valid...")
        try:
            tokenizer = BertTokenizer.from_pretrained(model_path)
            model = BertForSequenceClassification.from_pretrained(model_path)
            print("✓ Existing model loaded successfully!")
            print("\n" + "=" * 60)
            print("Setup complete! Your BERT model is ready to use.")
            print("=" * 60)
            return True
        except Exception as e:
            print(f"✗ Existing model is corrupted: {e}")
            print("Will download a fresh copy...")
    
    print(f"\n[3/3] Downloading BERT base model (this may take a few minutes)...")
    print("Model: bert-base-uncased")
    
    try:
        # Download pre-trained BERT model
        tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
        model = BertForSequenceClassification.from_pretrained(
            'bert-base-uncased',
            num_labels=2  # Binary classification: safe vs phishing
        )
        
        print("✓ Model downloaded successfully")
        
        # Save to local directory
        print(f"\nSaving model to: {model_path}")
        os.makedirs(model_path, exist_ok=True)
        tokenizer.save_pretrained(model_path)
        model.save_pretrained(model_path)
        
        print("✓ Model saved successfully")
        
        # Verify the saved model
        print("\nVerifying saved model...")
        test_tokenizer = BertTokenizer.from_pretrained(model_path)
        test_model = BertForSequenceClassification.from_pretrained(model_path)
        print("✓ Verification successful!")
        
        print("\n" + "=" * 60)
        print("SUCCESS! BERT model is now ready for phishing detection.")
        print("=" * 60)
        print("\nNOTE: This is a base BERT model. For better accuracy,")
        print("you should train it on phishing email data using the")
        print("training scripts in the 'training' directory.")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n✗ ERROR: Failed to download/save model")
        print(f"Details: {e}")
        print("\nTroubleshooting:")
        print("1. Check your internet connection")
        print("2. Ensure you have enough disk space (~500MB)")
        print("3. Try running: pip install --upgrade transformers torch")
        return False

if __name__ == "__main__":
    print("\n")
    success = setup_bert_model()
    print("\n")
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
