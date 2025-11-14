git remote add origin https://github.com/AllenJoseph0/AgentViewer-AgentGen.git
git branch -M main
git push -u origin main

# Project Setup Guide

This guide explains how to set up and run the project on **Windows**, **Linux**, and **macOS**.

---

## 🧱 Backend Setup

### **1. Create and Activate Virtual Environment**

#### 🪟 **Windows**
```bash
python -m venv venv
venv\Scripts\activate
```

#### 🐧 **Ubuntu / Linux / macOS**
```bash
python3 -m venv venv
source venv/bin/activate
```

### **2. Install Dependencies**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### **3. Export Updated Requirements**
```bash
pip freeze > requirements.txt
```

---

## ⚙️ Run the Project

### **Frontend**
```bash
cd frontend
npm start
```

### **Qdrant (Vector Database)**
```bash
docker-compose up
```

### **FastAPI Backend**
Choose one of the following commands:
```bash
python main.py
```
**or**
```bash
uvicorn main:app
```
**or (recommended for development):**
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🧭 Git Commands

### **Check Status**
```bash
git status
```

### **Add Changes**
```bash
git add .

```

### **Commit Changes**
```bash
git commit -m "updated code"
```

### **Push to Remote**
```bash
git push origin main
git push origin master

```

### **Pull Latest Changes**
```bash
git pull origin main
```

---

✅ **You're all set!**

This README provides a quick overview of the development workflow for setting up, running, and maintaining the project.