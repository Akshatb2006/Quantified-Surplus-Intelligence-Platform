import kagglehub
import pandas as pd
import os

def main():
    # Download latest version
    print("Downloading dataset...")
    path = kagglehub.dataset_download("dhrubangtalukdar/store-item-demand-forecasting-dataset")
    print("Path to dataset files:", path)

    # List files in the directory
    files = os.listdir(path)
    print("Files found:", files)

    # Read the main CSV file (assuming it's train.csv or similar)
    csv_file = None
    for f in files:
        if f.endswith('.csv') and 'train' in f.lower():
            csv_file = os.path.join(path, f)
            break
        elif f.endswith('.csv'): # Fallback to any csv
            csv_file = os.path.join(path, f)
    
    if csv_file:
        print(f"Reading {csv_file}...")
        df = pd.read_csv(csv_file)
        print("Dataset Head:")
        print(df.head())
        print("\nDataset Info:")
        print(df.info())
        print("\nUnique Items:")
        if 'item' in df.columns:
            print(df['item'].unique())
        elif 'item_id' in df.columns:
            print(df['item_id'].unique())
            
        print("\nDate Range:")
        if 'date' in df.columns:
            print(f"Start: {df['date'].min()}, End: {df['date'].max()}")
            
        # Save a sample for reference locally
        sample_path = os.path.join(os.getcwd(), 'kaggle_sample.csv')
        df.head(100).to_csv(sample_path, index=False)
        print(f"Saved sample to {sample_path}")
        
    else:
        print("No CSV file found in the downloaded dataset.")

if __name__ == "__main__":
    main()
