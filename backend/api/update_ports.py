import os

paths = [
    r"C:\Users\laksh\OneDrive\Desktop\phishguard\frontend\src\components\Sidebar.jsx",
    r"C:\Users\laksh\OneDrive\Desktop\phishguard\frontend\src\components\EmailList.jsx",
    r"C:\Users\laksh\OneDrive\Desktop\phishguard\frontend\src\components\EmailDetail.jsx",
    r"C:\Users\laksh\OneDrive\Desktop\phishguard\frontend\src\components\Chatbot.jsx"
]

for p in paths:
    with open(p, "r", encoding="utf-8") as f:
        content = f.read()
    new_content = content.replace("127.0.0.1:8000", "127.0.0.1:8001")
    with open(p, "w", encoding="utf-8") as f:
        f.write(new_content)
print("Updated all frontend ports to 8001")
