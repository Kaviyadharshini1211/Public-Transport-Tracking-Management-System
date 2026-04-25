import os
import pymongo
import gridfs
from dotenv import load_dotenv

# Load env variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

# Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/pt_tracking")
MODEL_FILENAME = "eta_model.pkl"
MODEL_PATH = os.path.join(os.path.dirname(__file__), MODEL_FILENAME)

def upload_model():
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Error: Local model {MODEL_PATH} not found.")
        print("Please run train_model.py to generate it first.")
        return

    print(f"📤 Connecting to MongoDB to upload {MODEL_FILENAME}...")
    try:
        # Extract DB name from URI
        db_name = "test" 
        if '/' in MONGO_URI.split('?')[-2]:
             db_name = MONGO_URI.split('?')[-2].split('/')[-1]
             if not db_name: db_name = "test"

        client = pymongo.MongoClient(MONGO_URI)
        db = client[db_name]
        fs = gridfs.GridFS(db)

        # Check if exists and delete old versions
        existing = fs.find_one({"filename": MODEL_FILENAME})
        if existing:
            print("Deleting older version of model from database...")
            fs.delete(existing._id)

        # Upload new file
        with open(MODEL_PATH, "rb") as f:
            fs.put(f, filename=MODEL_FILENAME)
        
        print(f"✅ Successfully uploaded {MODEL_FILENAME} to MongoDB GridFS!")

    except Exception as e:
        print(f"❌ Failed to upload model: {e}")

if __name__ == "__main__":
    upload_model()
