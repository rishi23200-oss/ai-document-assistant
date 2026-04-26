from fastapi import FastAPI, UploadFile, File, Form
from pypdf import PdfReader
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import warnings
warnings.filterwarnings('ignore')

app = FastAPI()
# Allow frontend to talk with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

documents = []
vector_store = None

# Load Whisper model
model = whisper.load_model("base")


@app.get("/")
def home():
    return {"message": "AI Document Chatbot Backend Running"}


# -------- PDF Upload --------
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    global vector_store

    reader = PdfReader(file.file)

    text = ""
    for page in reader.pages:
        text += page.extract_text()

    splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_text(text)

    embeddings = HuggingFaceEmbeddings()

    vector_store = FAISS.from_texts(chunks, embeddings)

    return {"message": "PDF uploaded and processed successfully"}


# -------- Ask Question --------
def extract_section(text, keyword):

    lines = text.split("\n")
    result = []

    capture = False

    for line in lines:

        if keyword.lower() in line.lower():
            capture = True

        if capture:
            result.append(line)

        if capture and line.strip() == "":
            break

    return "\n".join(result)
# -------- Ask Question --------
@app.post("/ask")
async def ask_question(question: str = Form(...)):

    global vector_store

    if vector_store is None:
        return {"answer": "Please upload a document first."}

    docs = vector_store.similarity_search(question)

    if not docs:
        return {"answer": "No relevant information found."}

    text = docs[0].page_content

    q = question.lower()

    # Skills question
    if "skill" in q:
        answer = extract_section(text, "skills")

    # Projects question
    elif "project" in q:
        answer = extract_section(text, "projects")

    # Education question
    elif "education" in q:
        answer = extract_section(text, "education")

    # Experience / Internship
    elif "experience" in q or "internship" in q:
        answer = extract_section(text, "experience")

    else:
        answer = text

    return {
        "question": question,
        "answer": answer
    }
    
    
    
# -------- Audio Upload -------
@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):

    contents = await file.read()

    with open("audio.wav", "wb") as f:
        f.write(contents)

    result = model.transcribe("audio.wav")

    return {
        "message": "Audio uploaded successfully",
        "text": result["text"]
    }
    
    

from pydantic import BaseModel

class TextRequest(BaseModel):
    text: str


@app.post("/summarize")
async def summarize(data: TextRequest):

    text = data.text

    # simple summarization logic
    sentences = text.split(".")
    summary = ".".join(sentences[:3])

    return {
        "summary": summary
    }
    
 
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)