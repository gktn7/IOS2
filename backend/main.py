from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from typing import Optional, List
from datetime import datetime
import httpx
import uuid
import hashlib

MONGO_URI    = "mongodb://localhost:27017"
DB_NAME      = "haber_app"
NEWS_API_KEY = "39af87e842644a7c9a65e21302a518b6"
NEWS_API_URL = "https://newsapi.org/v2/top-headlines"

client  = MongoClient(MONGO_URI)
db      = client[DB_NAME]
users   = db["users"]
history = db["history"]
likes   = db["likes"]
comments = db["comments"]

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

class HistoryArticle(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None
    urlToImage: Optional[str] = None
    publishedAt: Optional[str] = None
    source_name: Optional[str] = None
    category: Optional[str] = None

class HistoryReq(BaseModel):
    user_id: str
    article: HistoryArticle

class LikeReq(BaseModel):
    user_id: str
    article_id: str
    article_url: str
    article_title: Optional[str] = None
    article_image: Optional[str] = None
    article_description: Optional[str] = None
    article_content: Optional[str] = None
    article_source: Optional[str] = None
    article_published_at: Optional[str] = None
    article_category: Optional[str] = None

class CommentReq(BaseModel):
    user_id: str
    username: str
    article_url: str
    text: str

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
        "created_at": datetime.utcnow().isoformat()
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
                url = art.get("url", "")
                art_id = hashlib.md5(url.encode()).hexdigest() if url else str(uuid.uuid4())
                articles.append({
                    "id": art_id,
                    "title": art.get("title"),
                    "description": art.get("description"),
                    "content": art.get("content"),
                    "url": url,
                    "urlToImage": art.get("urlToImage") or "https://picsum.photos/seed/news/800/450",
                    "publishedAt": art.get("publishedAt"),
                    "source": {"name": art.get("source", {}).get("name", "Bilinmiyor")},
                    "category": category
                })
            return {"articles": articles, "total": len(articles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/news/news-info")
def get_news_info(article_url: str, user_id: Optional[str] = None):
    like_count = likes.count_documents({"article_url": article_url})
    is_liked = False
    if user_id:
        is_liked = likes.find_one({"article_url": article_url, "user_id": user_id}) is not None
    article_comments = list(comments.find({"article_url": article_url}).sort("created_at", -1))
    for c in article_comments:
        c["_id"] = str(c["_id"])
    return {
        "like_count": like_count,
        "is_liked": is_liked,
        "comments": article_comments
    }

@app.post("/news/like")
def toggle_like(req: LikeReq):
    existing = likes.find_one({"user_id": req.user_id, "article_url": req.article_url})
    if existing:
        likes.delete_one({"_id": existing["_id"]})
        return {"status": "unliked", "liked": False}
    else:
        likes.insert_one({
            "user_id": req.user_id,
            "article_id": req.article_id,
            "article_url": req.article_url,
            "article_title": req.article_title or 'Haber',
            "article_image": req.article_image,
            "article_description": req.article_description,
            "article_content": req.article_content,
            "article_source": req.article_source,
            "article_published_at": req.article_published_at,
            "article_category": req.article_category,
            "created_at": datetime.utcnow().isoformat()
        })
        return {"status": "liked", "liked": True}

@app.post("/news/comment")
def add_comment(req: CommentReq):
    if not req.text.strip():
        raise HTTPException(400, "Yorum boş olamaz.")
    comment_doc = {
        "user_id": req.user_id,
        "username": req.username,
        "article_url": req.article_url,
        "text": req.text,
        "created_at": datetime.utcnow().isoformat()
    }
    result = comments.insert_one(comment_doc)
    comment_doc["_id"] = str(result.inserted_id)
    return {"status": "ok", "comment": comment_doc}

@app.post("/history")
def add_to_history(req: HistoryReq):
    existing = history.find_one({
        "user_id": req.user_id,
        "article.id": req.article.id
    })
    doc = {
        "user_id": req.user_id,
        "article": req.article.dict(),
        "viewed_at": datetime.utcnow().isoformat()
    }
    if existing:
        history.update_one(
            {"_id": existing["_id"]},
            {"$set": {"viewed_at": doc["viewed_at"]}}
        )
    else:
        history.insert_one(doc)
    return {"status": "ok"}

@app.get("/history/{user_id}")
def get_history(user_id: str):
    items = list(
        history.find({"user_id": user_id}).sort("viewed_at", -1).limit(50)
    )
    result = []
    for item in items:
        art = item["article"]
        result.append({
            "id": art.get("id"),
            "title": art.get("title"),
            "description": art.get("description"),
            "content": art.get("content"),
            "url": art.get("url"),
            "urlToImage": art.get("urlToImage"),
            "publishedAt": art.get("publishedAt"),
            "source": {"name": art.get("source_name", "Bilinmiyor")},
            "category": art.get("category"),
            "viewed_at": item.get("viewed_at")
        })
    return {"history": result, "total": len(result)}

@app.get("/profile/{user_id}")
def get_profile(user_id: str):
    from bson import ObjectId
    try:
        user = users.find_one({"_id": ObjectId(user_id)})
    except:
        user = None
    if not user:
        raise HTTPException(404, "Kullanıcı bulunamadı.")
    liked_count = likes.count_documents({"user_id": user_id})
    comment_count = comments.count_documents({"user_id": user_id})
    user_likes = list(likes.find({"user_id": user_id}).sort("created_at", -1))
    for l in user_likes:
        l["_id"] = str(l["_id"])
    user_comments = list(comments.find({"user_id": user_id}).sort("created_at", -1))
    for c in user_comments:
        c["_id"] = str(c["_id"])
    return {
        "user": {
            "name": user["name"],
            "email": user["email"],
            "created_at": user.get("created_at")
        },
        "stats": {
            "liked_count": liked_count,
            "comment_count": comment_count
        },
        "likes": user_likes,
        "comments": user_comments
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
