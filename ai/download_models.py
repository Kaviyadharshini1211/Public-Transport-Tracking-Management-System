import os
import pymongo
import gridfs
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/pt_tracking")

MODELS = [
    {
        "filename": "eta_model.pkl",
        "path": os.path.join(os.path.dirname(__file__), "models", "eta", "eta_model.pkl")
    },
    {
        "filename": "assignment_model.pkl",
        "path": os.path.join(os.path.dirname(__file__), "models", "assignment", "assignment_model.pkl")
    }
]

def download_models():
    print("Connecting to MongoDB to fetch models...")
    try:
        db_name = "test" 
        if '/' in MONGO_URI.split('?')[-2]:
            db_name = MONGO_URI.split('?')[-2].split('/')[-1]
            if not db_name: db_name = "test"

        client = pymongo.MongoClient(MONGO_URI)
        db = client[db_name]
        fs = gridfs.GridFS(db)

        for model in MODELS:
            # Ensure target dir exists
            os.makedirs(os.path.dirname(model["path"]), exist_ok=True)
            
            if os.path.exists(model["path"]):
                print(f"Model {model['filename']} already exists locally. Skipping download.")
                continue

            file_doc = fs.find_one({"filename": model["filename"]})
            if not file_doc:
                print(f"Error: {model['filename']} not found in MongoDB GridFS. Please upload it first.")
                continue

            with open(model["path"], "wb") as f:
                f.write(file_doc.read())
            
            print(f"Successfully downloaded {model['filename']} ({file_doc.length} bytes) to {model['path']}")

    except Exception as e:
        print(f"Failed to download models: {e}")

if __name__ == "__main__":
    download_models()
