from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel

from database import engine
from sqlalchemy import text

templates = Jinja2Templates(directory="templates")

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={}
    )

@app.get("/api/transactions")
def get_transactions():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT * FROM transactions")
        )
        rows = result.mappings().all()
        return rows

class TransactionCreate(BaseModel):
    type: str
    date: str
    category: str
    description: str
    amount: int

@app.post("/api/transactions")
def create_transaction(transaction: TransactionCreate):
    with engine.begin() as connection:
        result = connection.execute(
            text("INSERT INTO transactions (type, date, category, description, amount) VALUES (:type, :date, :category, :description, :amount) RETURNING *"),
            {
                "type": transaction.type,
                "date": transaction.date,
                "category": transaction.category,
                "description": transaction.description,
                "amount": transaction.amount
            }
        )
        saved = result.mappings().first()
    return {"message": "저장 완료", "transaction": saved}