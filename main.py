import os

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel
from supabase import Client, create_client

from database import engine
from sqlalchemy import text

templates = Jinja2Templates(directory="templates")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")

if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL과 SUPABASE_PUBLISHABLE_KEY 환경변수가 필요합니다."
    )

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


def get_current_user_id(
    authorization: str | None = Header(default=None)
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    access_token = authorization.removeprefix("Bearer ").strip()

    try:
        response = supabase.auth.get_user(access_token)
    except Exception as error:
        print(f"Supabase access token validation failed: {error}")
        raise HTTPException(status_code=401, detail="유효하지 않은 로그인입니다.")

    if not response.user:
        raise HTTPException(status_code=401, detail="유효하지 않은 로그인입니다.")

    return str(response.user.id)

@app.get("/")
def read_root(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "supabase_url": SUPABASE_URL,
            "supabase_publishable_key": SUPABASE_PUBLISHABLE_KEY
        }
    )

@app.get("/api/transactions")
def get_transactions(user_id: str = Depends(get_current_user_id)):
    with engine.connect() as connection:
        result = connection.execute(
            text(
                "SELECT * FROM transactions "
                "WHERE user_id = :user_id "
                "ORDER BY date DESC, id DESC"
            ),
            {"user_id": user_id}
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
def create_transaction(
    transaction: TransactionCreate,
    user_id: str = Depends(get_current_user_id)
):
    with engine.begin() as connection:
        result = connection.execute(
            text(
                "INSERT INTO transactions "
                "(user_id, type, date, category, description, amount) "
                "VALUES (:user_id, :type, :date, :category, :description, :amount) "
                "RETURNING *"
            ),
            {
                "user_id": user_id,
                "type": transaction.type,
                "date": transaction.date,
                "category": transaction.category,
                "description": transaction.description,
                "amount": transaction.amount
            }
        )
        saved = result.mappings().first()
    return {"message": "저장 완료", "transaction": saved}


@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: str,
    user_id: str = Depends(get_current_user_id)
):
    with engine.begin() as connection:
        result = connection.execute(
            text(
                "DELETE FROM transactions "
                "WHERE id = :transaction_id AND user_id = :user_id"
            ),
            {
                "transaction_id": transaction_id,
                "user_id": user_id
            }
        )

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="내역을 찾을 수 없습니다.")

    return {"message": "삭제 완료"}
