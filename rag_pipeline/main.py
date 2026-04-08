import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from operator import itemgetter

# Load environment variables (like OPENAI_API_KEY) from .env file
load_dotenv()

# Constants
PDF_PATH = "product_manual.pdf"
CHROMA_DB_DIR = "./chroma_db"
COLLECTION_NAME = "manual_collection"

# 1. Indexing Phase
def build_and_index_vectorstore(pdf_path: str, persist_directory: str):
    """Loads PDF, chunks text, and indexes into ChromaDB."""
    if not os.path.exists(pdf_path):
        print(f"Error: Could not find {pdf_path}.")
        print("Please run 'python create_pdf.py' first to generate a dummy product manual.")
        return None
        
    print("Loading PDF...")
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    
    print(f"Loaded {len(documents)} pages. Splitting text...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        add_start_index=True 
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split document into {len(chunks)} chunks.")

    print("Generating embeddings and storing in ChromaDB...")
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_directory,
        collection_name=COLLECTION_NAME
    )
    print("Indexing complete!")
    return vectorstore

# 2. RAG Prompt Template
RAG_SYSTEM_TEMPLATE = """
You are an expert technical support assistant for our product manual.
Use the following pieces of retrieved context to answer the user's question.
If you don't know the answer or the context does not contain the information, state exactly: "I cannot answer this based on the provided manual."
Do not attempt to guess or use outside knowledge.
Always cite the page number(s) from the context when providing your answer.

Context:
{context}
"""

RAG_PROMPT = ChatPromptTemplate.from_messages([
    ("system", RAG_SYSTEM_TEMPLATE),
    ("human", "{question}")
])

# 3. Querying Phase
def setup_retriever_pipeline(persist_directory: str):
    """Loads the existing ChromaDB and sets up the LangChain pipeline."""
    if not os.path.exists(persist_directory):
        print(f"Error: Vector DB not found at {persist_directory}.")
        print("Please build the index first.")
        return None, None
        
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma(
        persist_directory=persist_directory, 
        embedding_function=embeddings,
        collection_name=COLLECTION_NAME
    )
    
    # Retrieve top 4 most similar chunks
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    
    # Simple formatting function to combine chunks and extract metadata
    def format_docs(docs):
        return "\n\n".join(f"[Page {doc.metadata.get('page', 'Unknown')}]\n{doc.page_content}" for doc in docs)
    
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    
    # Constructing the LCEL (LangChain Expression Language) Chain
    rag_chain = (
        {
            "context": itemgetter("question") | retriever | format_docs, 
            "question": itemgetter("question")
        }
        | RAG_PROMPT
        | llm
        | StrOutputParser()
    )
    
    return rag_chain, retriever

if __name__ == "__main__":
    if not os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY") == "your_openai_api_key_here":
        print("ERROR: Please set your OPENAI_API_KEY in the .env file before running.")
        exit(1)

    print("===== Phase 1: Indexing =====")
    # Only index if the database directory doesn't exist yet
    if not os.path.exists(CHROMA_DB_DIR):
        print("Vector database not found. Indexing the PDF...")
        build_and_index_vectorstore(PDF_PATH, CHROMA_DB_DIR)
    else:
        print("Vector database already exists. Skipping indexing.")
    
    print("\n===== Phase 2: Setup Pipeline =====")
    chain, retriever = setup_retriever_pipeline(CHROMA_DB_DIR)
    
    if chain:
        user_query = "How do I clean the optical sensor?"
        print(f"\nUser Query: {user_query}")
        print("-" * 50)
        
        # Execute chain
        print("Querying the RAG system...")
        response = chain.invoke({"question": user_query})
        print("\nFinal Answer:\n", response)
