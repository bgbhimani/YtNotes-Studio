# from motor.motor_asyncio import AsyncIOMotorClient
# from pymongo.server_api import ServerApi
# import os
# from dotenv import load_dotenv

# load_dotenv()

# MONGO_DETAILS = os.getenv("MONGO_DETAILS")

# client = AsyncIOMotorClient(MONGO_DETAILS, server_api=ServerApi('1'))

# database = client.get_database("YtNotes_Studio") # Or get from URI

# def get_db():
#     return database



import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")

client = MongoClient(
    MONGO_URL,
    tls=True,
    tlsCAFile=certifi.where()
)

db = client["yt_notes"]

chat_collection = db["chats"]
video_collection = db["videos"]
chunk_collection = db["chunks"]
ppt_collection = db["ppts"]
voice_collection = db["voices"]