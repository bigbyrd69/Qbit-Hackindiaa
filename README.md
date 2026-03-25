# QBIT 🚀
### Privacy-First, Offline AI Log Analyzer & Root Cause Identifier

**QBIT** is a high-performance observability tool built for the **HackIndia** hackathon. It combines **Unsupervised Machine Learning** for anomaly detection with a **Local LLM** to provide real-time, air-gapped root cause analysis. No data ever leaves your machine.

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
| **Backend** | Python (FastAPI, Uvicorn) |
| **Local AI Engine** | **Ollama** (Model: `qwen2.5:0.5b`) |
| **ML Engine** | Scikit-learn (Isolation Forest), NumPy |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Chart.js, Vis.js |
| **Streaming** | Server-Sent Events (SSE) |

---

## 🚀 Installation & Setup

### **1. Prerequisites**
* **Python 3.10+** installed on your system.
* **Ollama** installed ([ollama.com](https://ollama.com)).
* Pull the local AI model by running this in your terminal:
  ```bash
  ollama pull qwen2.5:0.5b

  2. Environment Variables
Create a .env file in the root directory of the project and add the following:

Code snippet
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b
PORT=8000
3. Install Dependencies
Open your terminal, navigate to the project folder, and set up your Python virtual environment:

Bash
# 1. Create the virtual environment
python -m venv venv

# 2. Activate the environment (Windows)
.\venv\Scripts\activate
# (For Mac/Linux use: source venv/bin/activate)

# 3. Install required packages

pip install -r requirements.txt


4. Run the Application


Start the FastAPI server from your terminal:


uvicorn main:app --reload --port 8000

Then, double-click analyzer.html to open the dashboard directly in your web browser.

🖥 Dashboard Features
Live Monitor: Real-time scrolling feed with color-coded severity.


Peak Score: A live gauge showing the highest anomaly score detected in the current stream.


Service Topology: A live-animated visual network map connecting system microservices.


AI Crash Reports: Click any critical alert to generate an instant, local Root Cause Analysis report.
