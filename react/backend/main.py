from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Literal
from openpyxl import Workbook
import io
import random
from datetime import datetime


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TableField(BaseModel):
    id: str
    name: str
    type: Literal["STRING", "NUMBER", "DATE", "BOOLEAN"]

class GenerateRequest(BaseModel):
    topic: str
    rowCount: int
    fields: List[TableField]


# ====== Endpoint ======

@app.post("/generate-excel")
async def generate_excel(data: GenerateRequest):

    wb = Workbook()
    ws = wb.active
    ws.title = data.topic if data.topic else "Sheet1"

    # Header
    headers = [field.name for field in data.fields]
    ws.append(headers)


    # Sauvegarde en mémoire
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=generated.xlsx"
        },
    )