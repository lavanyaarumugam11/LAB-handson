import streamlit as st
import pandas as pd
import tempfile
import os
import time

# Import our LangGraph pipeline
from etl_app import build_etl_graph

# --- PAGE CONFIG ---
st.set_page_config(page_title="Magic ETL", page_icon="✨", layout="wide", initial_sidebar_state="expanded")

# --- CUSTOM CSS FOR COLOR ---
st.markdown("""
<style>
    /* Colorful Headers */
    h1 {
        background: -webkit-linear-gradient(45deg, #FF4B4B, #FF904B);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
    }
    h2, h3 {
        color: #1E3A8A !important;
    }
    
    /* Make metrics pop! */
    div[data-testid="stMetric"] {
        background-color: #F8FAFC;
        padding: 15px;
        border-radius: 12px;
        border-left: 5px solid #FF4B4B;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    /* Style the sidebar */
    [data-testid="stSidebar"] {
        background-color: #F0F4F8;
    }
</style>
""", unsafe_allow_html=True)

# --- INIT ---
@st.cache_resource
def get_graph():
    return build_etl_graph()

pipeline = get_graph()

# --- SIDEBAR ---
with st.sidebar:
    st.title("🎛️ Configurations")
    st.info("Welcome to the **Interactive LangGraph ETL Dashboard**! 🚀")
    
    st.markdown("### 🧩 Pipeline Architecture")
    st.markdown(
        "- **Extract Node**: Parses raw input\n"
        "- **Transform Node**: Drops blanks, deduplicates, standardizes names in Pandas\n"
        "- **Load Node**: Serves perfect file"
    )
    st.markdown("---")
    st.caption("Powered by: LangGraph, Pandas & Streamlit ❤️")

# --- MAIN PAGE ---
st.title("✨ Interactive LangGraph Data Studio")
st.markdown("Upload your messy dataset, **edit it interactively** right here, and let the pipeline work its magic.")

uploaded_file = st.file_uploader("📥 Drag & Drop your Raw CSV Dataset here", type=["csv"])

if uploaded_file is not None:
    st.markdown("---")
    
    # Read Initial Data
    raw_df = pd.read_csv(uploaded_file)
    
    # INTERACTIVE TABS
    tab1, tab2 = st.tabs(["📋 Interactive Raw Data", "📊 Data Quality Analytics"])
    
    with tab1:
        st.subheader("1. Extract: Tweak Before Pipeline")
        st.caption("You can click directly inside this table to manually fix or edit specific cells before sending it to the graph!")
        # Use data_editor which is highly interactive instead of static dataframe
        edited_raw_df = st.data_editor(raw_df, num_rows="dynamic", use_container_width=True)
    
    with tab2:
        st.subheader("Pre-Pipeline Data Snapshot")
        colA, colB, colC = st.columns(3)
        colA.metric("Total Rows", len(raw_df))
        colB.metric("Total Columns", len(raw_df.columns))
        # Find completely missing data cells to highlight bad quality
        total_missing = raw_df.isnull().sum().sum()
        colC.metric("Missing/Blank Cells", total_missing, delta=str(total_missing), delta_color="inverse")
        
        st.markdown("#### The Blanks Chart (Missing Values Per Column)")
        missing_data = raw_df.isnull().sum().reset_index()
        missing_data.columns = ['Column', 'Missing Values']
        st.bar_chart(missing_data.set_index('Column'), color="#FF4B4B", use_container_width=True)
        
    st.write("---")
    
    # BIG ACTION BUTTON
    col_empty1, col_btn, col_empty2 = st.columns([1, 2, 1])
    with col_btn:
        run_pressed = st.button("🚀 IGNITE LANGGRAPH PIPELINE", type="primary", use_container_width=True)

    if run_pressed:
        # Colorful Progress
        with st.status("🛠️ Pipeline Magic in Progress...", expanded=True) as status:
            st.write("⚙️ Initializing State Variables...")
            time.sleep(0.5) # Fake sleep for visual effect
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp_in:
                # IMPORTANT: Save the *edited* dataframe, applying user's interactive changes!
                edited_raw_df.to_csv(tmp_in.name, index=False)
                input_path = tmp_in.name
            
            output_path = input_path.replace(".csv", "_cleaned.csv")
            initial_state = {
                "input_path": input_path,
                "output_path": output_path,
                "raw_df": None,
                "cleaned_df": None,
                "status": "pending"
            }
            
            try:
                st.write("🔮 Navigating 'Extract' Node...")
                time.sleep(0.5)
                st.write("🧼 Scrubbing pandas arrays in 'Transform' Node...")
                
                # Execute Pipeline
                final_state = pipeline.invoke(initial_state)
                cleaned_df = final_state["cleaned_df"]
                
                st.write("💾 Passing data through 'Load' Node...")
                time.sleep(0.5)
                
                status.update(label="✅ Pipeline Execution Successful!", state="complete", expanded=False)
                
                # LAUNCH CELEBRATION
                st.balloons()
                
                st.success("🎉 Data successfully cleaned! The pipeline knocked it out of the park.")
                
                # POST EXECUTION METRICS
                res_col1, res_col2 = st.columns(2)
                res_col1.metric(
                    label="Rows Kept", 
                    value=len(cleaned_df), 
                    delta=f"{len(cleaned_df) - len(edited_raw_df)} Duplicates/Blanks Removed"
                )
                res_col2.metric(
                    label="Null Values Left", 
                    value=cleaned_df.isnull().sum().sum(), 
                    delta=f"{-total_missing} Imputed & Fixed",
                    delta_color="normal"
                )
                
                st.subheader("💎 Masterpiece: Cleaned Dataset")
                st.dataframe(cleaned_df, use_container_width=True, height=250)
                
                st.markdown("---")
                
                # COLORFUL DOWNLOAD BUTTON
                cleaned_csv = cleaned_df.to_csv(index=False).encode('utf-8')
                st.download_button(
                    label="💾 Claim Cleaned Dataset",
                    data=cleaned_csv,
                    file_name="perfect_dataset.csv",
                    mime="text/csv",
                    use_container_width=True
                )
                
            except Exception as e:
                status.update(label="❌ Pipeline Failed", state="error")
                st.error(f"Oh no! A node failed: {e}")
            finally:
                if os.path.exists(input_path):
                    os.remove(input_path)
                if os.path.exists(output_path):
                    os.remove(output_path)
