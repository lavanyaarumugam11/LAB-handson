import os
import uuid
import json
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
CHROMA_PERSIST_DIR = os.getenv('CHROMA_PERSIST_DIR') or None

try:
    import chromadb
    from chromadb.config import Settings
except Exception:
    chromadb = None

import openai

if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

app = FastAPI(title="Clinical Trial Matching MVP")

# serve static UI
static_dir = os.path.join(os.path.dirname(__file__), 'static')
app.mount('/static', StaticFiles(directory=static_dir), name='static')

# In-memory stores (and simple audit)
PROTOCOL_STORE = {}   # protocol_id -> {text, criteria:[{id,text}], metadata}
AUDIT_LOG = []

# initialize chroma client and collections
CHROMA_CLIENT = None
COLLECTIONS = {}

def init_chroma():
    global CHROMA_CLIENT, COLLECTIONS
    if chromadb is None:
        print('chromadb not installed; vector features disabled')
        return
    if CHROMA_CLIENT:
        return
    settings = Settings()
    if CHROMA_PERSIST_DIR:
        settings = Settings(chroma_db_impl="duckdb+parquet", persist_directory=CHROMA_PERSIST_DIR)
    CHROMA_CLIENT = chromadb.Client(settings)
    # create or get collections
    COLLECTIONS['criteria'] = CHROMA_CLIENT.get_or_create_collection('criteria')
    COLLECTIONS['patients'] = CHROMA_CLIENT.get_or_create_collection('patients')

def simple_fallback_embedding(text: str, dim: int = 384):
    # deterministic, cheap pseudo-embedding for local dev only
    vec = [0.0] * dim
    if not text:
        return vec
    for i, ch in enumerate(text[:dim]):
        vec[i] = (ord(ch) % 97) / 97.0
    return vec

def get_embedding_sync(text: str):
    if OPENAI_API_KEY:
        try:
            resp = openai.Embedding.create(model="text-embedding-3-small", input=text)
            return resp['data'][0]['embedding']
        except Exception as e:
            print('OpenAI embedding error:', e)
            return simple_fallback_embedding(text)
    else:
        return simple_fallback_embedding(text)

def extract_eligibility_heuristic(text: str):
    # Very simple heuristic extractor. Look for Inclusion/Exclusion sections.
    lower = text.lower()
    criteria = []
    for section in ['inclusion', 'inclusion criteria', 'eligibility - inclusion']:
        if section in lower:
            start = lower.find(section)
            snippet = text[start: start + 2000]
            # split by newline or numbered list
            parts = [p.strip() for p in snippet.split('\n') if p.strip()]
            # heuristically take lines after heading
            for p in parts[1:20]:
                if len(p) > 10:
                    criteria.append({'id': str(uuid.uuid4()), 'text': p})
            break
    if not criteria:
        # fallback: split by lines and take lines that look like criteria
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for l in lines[:30]:
            if len(l) > 30 and (l[0].isdigit() or l.startswith('-') or 'must' in l.lower() or 'eligible' in l.lower()):
                criteria.append({'id': str(uuid.uuid4()), 'text': l})
    return criteria


class PatientIn(BaseModel):
    patient_id: str
    age: Optional[int] = None
    gender: Optional[str] = None
    notes: str

@app.get('/', response_class=HTMLResponse)
def index():
    return FileResponse(os.path.join(static_dir, 'index.html'))


@app.post('/protocols/upload')
async def upload_protocol(file: UploadFile = File(...)):
    content = await file.read()
    try:
        text = content.decode('utf-8')
    except Exception:
        text = str(content)
    protocol_id = str(uuid.uuid4())
    criteria = extract_eligibility_heuristic(text)
    PROTOCOL_STORE[protocol_id] = {'text': text, 'criteria': criteria, 'metadata': {'filename': file.filename}}

    # ensure chroma initialized
    init_chroma()
    # index criteria embeddings
    if CHROMA_CLIENT:
        ids = []
        docs = []
        metas = []
        embeddings = []
        for c in criteria:
            cid = f"{protocol_id}::{c['id']}"
            ids.append(cid)
            docs.append(c['text'])
            metas.append({'protocol_id': protocol_id, 'criterion_id': c['id']})
            embeddings.append(get_embedding_sync(c['text']))
        if ids:
            COLLECTIONS['criteria'].add(ids=ids, documents=docs, metadatas=metas, embeddings=embeddings)

    AUDIT_LOG.append({'action': 'upload_protocol', 'protocol_id': protocol_id, 'filename': file.filename})
    return {'protocol_id': protocol_id, 'criteria_count': len(criteria), 'criteria_preview': criteria[:5]}


@app.post('/patients/ingest')
async def ingest_patient(p: PatientIn):
    init_chroma()
    pid = p.patient_id
    # store minimal metadata in chroma
    emb = get_embedding_sync(p.notes)
    if CHROMA_CLIENT:
        try:
            COLLECTIONS['patients'].add(ids=[pid], documents=[p.notes], metadatas=[{'age': p.age, 'gender': p.gender}], embeddings=[emb])
        except Exception as e:
            print('chroma add error', e)
    AUDIT_LOG.append({'action': 'ingest_patient', 'patient_id': pid})
    return {'patient_id': pid, 'status': 'ingested'}


@app.post('/match/run')
async def run_match(protocol_id: str = Form(...), top_k: int = Form(5)):
    # Note: in the demo UI, JSON body is used; accept both JSON and form
    # Try reading from PROTOCOL_STORE
    if protocol_id not in PROTOCOL_STORE:
        # try to accept JSON body form
        body = await app._get_request().json() if hasattr(app, '_get_request') else None
        raise HTTPException(status_code=404, detail='protocol_id not found')
    protocol = PROTOCOL_STORE[protocol_id]
    criteria = protocol.get('criteria', [])
    results = []
    init_chroma()
    if CHROMA_CLIENT and criteria:
        # For each criterion, query patients, then combine
        patient_scores = {}
        for c in criteria:
            emb = get_embedding_sync(c['text'])
            try:
                query_res = COLLECTIONS['patients'].query(query_embeddings=[emb], n_results=top_k)
            except Exception as e:
                print('chroma query error', e)
                query_res = {'ids': [[]], 'distances': [[]], 'metadatas': [[]], 'documents': [[]]}
            ids = query_res.get('ids', [[]])[0]
            distances = query_res.get('distances', [[]])[0]
            docs = query_res.get('documents', [[]])[0]
            for idx, pid in enumerate(ids):
                score = 1.0 - distances[idx] if distances else 0.0
                if pid not in patient_scores:
                    patient_scores[pid] = {'score': 0.0, 'evidence': []}
                patient_scores[pid]['score'] += score
                patient_scores[pid]['evidence'].append({'criterion': c['text'], 'excerpt': docs[idx] if idx < len(docs) else ''})
        # normalize and sort
        for pid, v in patient_scores.items():
            results.append({'patient_id': pid, 'raw_score': v['score'], 'evidence': v['evidence']})
        results.sort(key=lambda r: r['raw_score'], reverse=True)
    else:
        # fallback: empty result
        results = []

    AUDIT_LOG.append({'action': 'match_run', 'protocol_id': protocol_id, 'result_count': len(results)})
    return {'protocol_id': protocol_id, 'results': results[:top_k]}


@app.get('/audit')
def get_audit():
    return {'audit': AUDIT_LOG}
