import os
import json
import io
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Literal
from openpyxl import Workbook
from dotenv import load_dotenv

# Charger les variables d'environnement (dont la clé API)
load_dotenv()

# Configuration de l'API Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("⚠️ La clé GEMINI_API_KEY est introuvable dans le fichier .env")

genai.configure(api_key=api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mon-portfolio-pink-mu.vercel.app", "http://localhost:3000"],
    allow_credentials=False,
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
    if not data.fields:
        raise HTTPException(status_code=400, detail="Fields are required")
    
    # Limitation pour la version gratuite (pour éviter des requêtes trop longues)
    if data.rowCount > 50:
        data.rowCount = 50 

    # 1. Construction du Prompt pour Gemini
    # On explique à l'IA exactement ce qu'on attend d'elle
    columns_info = ", ".join([f"'{f.name}' (type: {f.type})" for f in data.fields])
    
    prompt = f"""
    Tu es un expert en génération de données réalistes. 
    Génère exactement {data.rowCount} lignes de données sur le sujet suivant : "{data.topic}".
    Les colonnes attendues et leurs types sont : {columns_info}.
    
    Règles strictes :
    1. Renvoie UNIQUEMENT un tableau JSON (une liste de dictionnaires).
    2. Les clés de chaque dictionnaire doivent être exactement les noms des colonnes : {[f.name for f in data.fields]}.
    3. Respecte les types de données (ex: utilise des nombres pour NUMBER, des booléens true/false pour BOOLEAN, des dates au format YYYY-MM-DD pour DATE).
    """

    try:
        # 2. Appel à Gemini 1.5 Flash
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # On force le format de réponse en JSON pour éviter les erreurs de parsing
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        # 3. Parsing des données générées
        generated_data = json.loads(response.text)

    except Exception as e:
        print(f"Erreur IA : {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la génération des données par l'IA.")

    # 4. Création du fichier Excel
    wb = Workbook()
    ws = wb.active
    # Nettoyage du titre pour Excel (max 31 caractères et pas de caractères spéciaux)
    ws.title = (data.topic[:28] + "...") if data.topic else "Data"

    # Ajout des En-têtes (Headers)
    headers = [field.name for field in data.fields]
    ws.append(headers)

    # Ajout des Lignes générées
    if isinstance(generated_data, list):
        for row_data in generated_data:
            # On s'assure de mettre les valeurs dans le bon ordre
            row = [row_data.get(header, "") for header in headers]
            ws.append(row)

    # Sauvegarde en mémoire
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=generated_by_ai.xlsx"
        },
    )