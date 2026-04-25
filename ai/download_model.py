import os
import pymongo
import gridfs
from dotenv import load_dotenv

# Load env variables (useful for local testing)
load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

# Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/pt_tracking")
MODEL_FILENAME = "eta_model.pkl"
MODEL_DIR = os.getenv("MODEL_DIR", os.path.dirname(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, MODEL_FILENAME)

def download_model():
    if os.path.exists(MODEL_PATH):
        print(f"✅ Model already exists at {MODEL_PATH}. Skipping download.")
        return

    print(f"📥 Model not found locally. Connecting to MongoDB to fetch {MODEL_FILENAME}...")
    try:
        # Extract DB name from URI or default to 'pt_tracking'
        db_name = "test" # The user's Mongoose connection might default to 'test' if not specified in SRV
        if '/' in MONGO_URI.split('?')[-2]:
             db_name = MONGO_URI.split('?')[-2].split('/')[-1]
             if not db_name: db_name = "test"

        client = pymongo.MongoClient(MONGO_URI)
        db = client[db_name]
        fs = gridfs.GridFS(db)

        # Find the model file
        file_doc = fs.find_one({"filename": MODEL_FILENAME})
        if not file_doc:
            print(f"❌ Error: {MODEL_FILENAME} not found in MongoDB GridFS.")
            print("Please run upload_model.py first.")
            return

        # Download to volume
        os.makedirs(MODEL_DIR, exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            f.write(file_doc.read())
        
        print(f"✅ Successfully downloaded {MODEL_FILENAME} ({file_doc.length} bytes) to {MODEL_PATH}")

    except Exception as e:
        print(f"❌ Failed to download model: {e}")

if __name__ == "__main__":
    download_model()
