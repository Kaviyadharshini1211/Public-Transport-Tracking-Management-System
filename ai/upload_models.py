import os
import pymongo
import gridfs
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/pt_tracking")

MODELS = [
    {
        "filename": "eta_model.pkl",
        "path": os.path.join(os.path.dirname(__file__), "models", "eta", "eta_model.pkl"),
        "root_fallback": os.path.join(os.path.dirname(__file__), "eta_model.pkl")
    },
    {
        "filename": "assignment_model.pkl",
        "path": os.path.join(os.path.dirname(__file__), "models", "assignment", "assignment_model.pkl"),
        "root_fallback": os.path.join(os.path.dirname(__file__), "assignment_model.pkl")
    }
]

def upload_models():
    print("📤 Connecting to MongoDB to upload models...")
    try:
        db_name = "test" 
        if '/' in MONGO_URI.split('?')[-2]:
            db_name = MONGO_URI.split('?')[-2].split('/')[-1]
            if not db_name: db_name = "test"

        client = pymongo.MongoClient(MONGO_URI)
        db = client[db_name]
        fs = gridfs.GridFS(db)

        for model in MODELS:
            file_to_upload = model["path"] if os.path.exists(model["path"]) else model["root_fallback"]
            if not os.path.exists(file_to_upload):
                print(f"⚠️ Warning: Model file {model['filename']} not found at {model['path']} or root. Skip.")
                continue
            
            existing = fs.find_one({"filename": model["filename"]})
            if existing:
                print(f"Deleting older version of {model['filename']}...")
                fs.delete(existing._id)

            with open(file_to_upload, "rb") as f:
                fs.put(f, filename=model["filename"])
            
            print(f"✅ Successfully uploaded {model['filename']}!")

    except Exception as e:
        print(f"❌ Failed to upload models: {e}")

if __name__ == "__main__":
    upload_models()
