import pandas as pd
import logging
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ETL_Pipeline")

# 1. Define the State Schema
class ETLState(TypedDict):
    input_path: str
    output_path: str
    raw_df: Optional[pd.DataFrame]
    cleaned_df: Optional[pd.DataFrame]
    status: str

# 2. Define the Nodes
def extract_node(state: ETLState) -> ETLState:
    logger.info("Starting EXTRACT phase...")
    try:
        df = pd.read_csv(state["input_path"])
        logger.info(f"Extracted {len(df)} rows.")
        return {"raw_df": df, "status": "extracted"}
    except Exception as e:
        logger.error(f"Extract failed: {e}")
        raise e

def transform_node(state: ETLState) -> ETLState:
    logger.info("Starting TRANSFORM phase...")
    df = state.get("raw_df")
    
    if df is None or df.empty:
        raise ValueError("No data available for transformation.")

    # We make a copy so we don't accidentally mutate the original data
    df = df.copy()
    
    # Rule 1: Normalize column names
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
    
    # Rule 2: Remove completely empty rows
    df = df.dropna(how='all')
    
    # Rule 3: Remove duplicate rows
    df = df.drop_duplicates()
    
    # Rule 4: Handle missing values (Fill numeric NaNs with median, categorical with 'Unknown')
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
        else:
            df[col] = df[col].fillna('Unknown')

    logger.info(f"Transformed data down to {len(df)} rows.")
    return {"cleaned_df": df, "status": "transformed"}

def load_node(state: ETLState) -> ETLState:
    logger.info("Starting LOAD phase...")
    df = state.get("cleaned_df")
    output_path = state.get("output_path")
    
    if df is None:
        raise ValueError("No transformed data available to load.")
        
    df.to_csv(output_path, index=False)
    logger.info(f"Successfully saved cleaned data to {output_path}")
    
    return {"status": "loaded"}

# 3. Build and Compile the LangGraph
def build_etl_graph():
    workflow = StateGraph(ETLState)
    
    # Add nodes
    workflow.add_node("extract", extract_node)
    workflow.add_node("transform", transform_node)
    workflow.add_node("load", load_node)
    
    # Construct linear edges
    workflow.set_entry_point("extract")
    workflow.add_edge("extract", "transform")
    workflow.add_edge("transform", "load")
    workflow.add_edge("load", END)
    
    return workflow.compile()

if __name__ == "__main__":
    import os
    
    # Initialize app
    app = build_etl_graph()
    
    input_file = "raw_data.csv"
    output_file = "cleaned_data.csv"
    
    if not os.path.exists(input_file):
        logger.error(f"Input file {input_file} not found!")
        exit(1)
        
    # Define pipeline request
    initial_state = {
        "input_path": input_file,
        "output_path": output_file,
        "raw_df": None,
        "cleaned_df": None,
        "status": "pending"
    }
    
    # Run pipeline
    print("--- Invoking LangGraph Pipeline ---")
    final_state = app.invoke(initial_state)
    
    print("\n--- Final Cleaned DataFrame ---")
    print(final_state["cleaned_df"])
