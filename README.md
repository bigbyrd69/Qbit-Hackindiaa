# QBIT  🚀
### Privacy-First, Offline AI Log Analyzer & Root Cause Identifier

**QBIT** is a high-performance observability tool built for the **HackIndia** hackathon. It combines **Unsupervised Machine Learning** for anomaly detection with a **Local LLM (Ollama)** to provide real-time, air-gapped root cause analysis. No data ever leaves your machine.

---

## 🏗 System Architecture & Pipeline

QBIT operates on a decoupled, event-driven pipeline optimized for low-latency log processing.


### **The Intelligence Pipeline**
1. **Log Ingestion:** Logs are sent to the **FastAPI** backend via a `/log` endpoint.
2. **Feature Engineering:** Log messages are vectorized using TF-IDF to prepare them for the ML model.
3. **ML Anomaly Scoring:** An **Isolation Forest** (Scikit-learn) model assigns an anomaly score (0-100) to each line.
4. **Offline AI Reasoning:** If a log score exceeds the threshold, it is sent to **Ollama (Qwen2.5:0.5b)**. The local AI generates a "Whisperer Report" explaining the bug and suggesting a fix.
5. **Real-Time Push:** The UI updates instantly via **Server-Sent Events (SSE)**.

---

## 🛠 Tech Stack (100% Offline)

| Layer | Technology |
| :--- | :--- |
| **Backend** | Python (FastAPI) |
| **Local AI Engine** | **Ollama** (Model: `qwen2.5:0.5b`) |
| **ML Engine** | Scikit-learn (Isolation Forest) |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Streaming** | Server-Sent Events (SSE) |
| **Database** | SQLite (Incident Archiving) |

---

## 🚀 Installation & Setup

### **1. Prerequisites**
* **Python 3.10+**
* **Ollama** installed ([ollama.com](https://ollama.com))
* **Qwen2.5:0.5b** model pulled:
  ```bash
  ollama pull qwen2.5:0.5b

  

# QBIT (Log-Whisperer) 🚀
### Privacy-First, Offline AI Log Analyzer & Root Cause Identifier

**QBIT** is a high-performance observability tool built for the **HackIndia** hackathon. It combines **Unsupervised Machine Learning** for anomaly detection with a **Local LLM (Ollama)** to provide real-time, air-gapped root cause analysis. No data ever leaves your machine.

---

## 🏗 System Architecture & Pipeline

QBIT operates on a decoupled, event-driven pipeline optimized for low-latency log processing.


### **The Intelligence Pipeline**
1. **Log Ingestion:** Logs are sent to the **FastAPI** backend via a `/log` endpoint.
2. **Feature Engineering:** Log messages are vectorized using TF-IDF to prepare them for the ML model.
3. **ML Anomaly Scoring:** An **Isolation Forest** (Scikit-learn) model assigns an anomaly score (0-100) to each line.
4. **Offline AI Reasoning:** If a log score exceeds the threshold, it is sent to **Ollama (Qwen2.5:0.5b)**. The local AI generates a "Whisperer Report" explaining the bug and suggesting a fix.
5. **Real-Time Push:** The UI updates instantly via **Server-Sent Events (SSE)**.

---

## 🛠 Tech Stack (100% Offline)

| Layer | Technology |
| :--- | :--- |
| **Backend** | Python (FastAPI) |
| **Local AI Engine** | **Ollama** (Model: `qwen2.5:0.5b`) |
| **ML Engine** | Scikit-learn (Isolation Forest) |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Streaming** | Server-Sent Events (SSE) |
| **Database** | SQLite (Incident Archiving) |

---

## 🚀 Installation & Setup

### **1. Prerequisites**
* **Python 3.10+**
* **Ollama** installed ([ollama.com](https://ollama.com))
* **Qwen2.5:0.5b** model pulled:
  ```bash
  ollama pull qwen2.5:0.5b
2. Environment Setup
Create a .env file in the root directory:

Code snippet
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b
PORT=8000
3. Backend Installation
Bash
# Create and activate virtual environment
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn scikit-learn python-dotenv pandas requests
4. Run the Application
Start Ollama in your terminal.

Start the QBIT Backend:

Bash
python main.py
Open the Dashboard:
Open index.html in your browser. Ensure the status shows "System Online".

🖥 Dashboard Features
Live Monitor: Real-time scrolling feed with color-coded severity.

Peak Score: A live gauge showing the highest anomaly score detected in the current stream.

Service Topology: A visual map of the "System Gateway" status.

AI Crash Reports: Click any critical alert to get an instant, local RCA report.
