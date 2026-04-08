import os
import shutil
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse

# Import our LangGraph pipeline
from etl_app import build_etl_graph

app = FastAPI(
    title="LangGraph ETL Server", 
    description="A local API server to run our LangGraph data process pipeline"
)

# Initialize the LangGraph app once at startup
etl_graph = build_etl_graph()

@app.get("/")
def read_root():
    return {"message": "LangGraph ETL Server is running. Go to /docs to test the API."}

@app.post("/clean-data/")
async def clean_data(file: UploadFile = File(...)):
    # 1. Save uploaded file temporarily
    input_path = f"temp_{file.filename}"
    output_path = f"cleaned_{file.filename}"
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 2. Define the pipeline state
    initial_state = {
        "input_path": input_path,
        "output_path": output_path,
        "raw_df": None,
        "cleaned_df": None,
        "status": "pending"
    }
    
    try:
        # 3. Process via LangGraph
        print(f"--- Running Pipeline on {file.filename} ---")
        final_state = etl_graph.invoke(initial_state)
        
        # 4. Return the cleaned file directly as a download
        return FileResponse(
            path=output_path, 
            filename=f"cleaned_{file.filename}", 
            media_type="text/csv"
        )
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # This runs the server manually if you execute: python server.py
    uvicorn.run(app, host="127.0.0.1", port=8000)
