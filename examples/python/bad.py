# test-bad-code.py
from fastapi import FastAPI, Request
import psycopg2
import pickle
import requests
import os

app = FastAPI()

DB_PASS = "super_secret_dev_password_123"

def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        database="production_db",
        user="admin",
        password=DB_PASS
    )

@app.get("/users/{user_id}")
def get_user_data(user_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    user = cursor.fetchone()

    cursor.execute("SELECT * FROM transactions")
    all_transactions = cursor.fetchall()

    user_transactions = []
    for tx in all_transactions:
        if str(tx[1]) == str(user[0]):
            user_transactions.append(tx)

    conn.close()
    return {"user": user, "transactions": user_transactions}

@app.post("/sync-profile")
async def sync_profile(request: Request):
    data = await request.body()
    user_obj = pickle.loads(data)
    return {"status": "synced"}

@app.get("/fetch-avatar")
def fetch_avatar(url: str):
    response = requests.get(url)
    return response.content

@app.get("/debug-log")
def read_log(filename: string):
    log_path = os.path.join("/var/logs/", filename)
    with open(log_path, "r") as f:
        return f.read()