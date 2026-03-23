from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import httpx
import uuid

MONGO_URI    = "mongodb://localhost:27017"
DB_NAME      = "haber_app"
NEWS_API_KEY = "39af87e842644a7c9a65e21302a518b6"
NEWS_API_URL = "https://newsapi.org/v2/top-headlines"

client = MongoClient(MONGO_URI)
db     = client[DB_NAME]
users  = db["users"]

pwd   = CryptContext(schemes=["bcrypt"], deprecated="auto")
app   = FastAPI(title="Haber API")

app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

CATEGORY_MAP = {
    "teknoloji": "technology",
    "spor": "sports",
    "ekonomi": "business",
    "bilim": "science",
    "kültür": "entertainment",
    "dünya": "general",
    "tümü": "general"
}

class RegisterReq(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginReq(BaseModel):
    email: EmailStr
    password: str

@app.get("/")
def root():
    return {"message": "Haber API çalışıyor"}

@app.post("/auth/register")
def register(req: RegisterReq):
    if users.find_one({"email": req.email}):
        raise HTTPException(400, "Bu e-posta zaten kayıtlı.")
    result = users.insert_one({
        "name": req.name,
        "email": req.email,
        "password": pwd.hash(req.password),
    })
    uid = str(result.inserted_id)
    return {"user": {"id": uid, "name": req.name, "email": req.email}}

@app.post("/auth/login")
def login(req: LoginReq):
    user = users.find_one({"email": req.email})
    if not user or not pwd.verify(req.password, user["password"]):
        raise HTTPException(401, "E-posta veya şifre hatalı.")
    uid = str(user["_id"])
    return {"user": {"id": uid, "name": user["name"], "email": req.email}}

@app.get("/news")
async def get_news(category: str = "tümü", q: str = ""):
    mapped_category = CATEGORY_MAP.get(category, "general")
    
    params = {
        "apiKey": NEWS_API_KEY,
        "country": "us",
        "pageSize": 20
    }
    
    if q:
        params["q"] = q
    
    if mapped_category and category != "tümü":
        params["category"] = mapped_category

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(NEWS_API_URL, params=params)
            data = response.json()
            
            if data.get("status") != "ok":
                raise HTTPException(status_code=400, detail=data.get("message", "API Error"))
            
            articles = []
            for art in data.get("articles", []):
                if not art.get("title") or art.get("title") == "[Removed]":
                    continue
                    
                articles.append({
                    "id": str(uuid.uuid4()),
                    "title": art.get("title"),
                    "description": art.get("description"),
                    "content": art.get("content"),
                    "url": art.get("url"),
                    "urlToImage": art.get("urlToImage") or "https://picsum.photos/seed/news/800/450",
                    "publishedAt": art.get("publishedAt"),
                    "source": {"name": art.get("source", {}).get("name", "Bilinmiyor")},
                    "category": category
                })
            
            return {"articles": articles, "total": len(articles)}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
