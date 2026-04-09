import sqlite3
import os

DB_NAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), "phishguard.db")

def clear_data():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    
    # Check current count
    cur.execute("SELECT COUNT(*) FROM email_scans")
    count = cur.fetchone()[0]
    print(f"Current count: {count}")
    
    if count > 0:
        cur.execute("DELETE FROM email_scans")
        conn.commit()
        print(f"Deleted {count} emails. Database is now empty.")
    else:
        print("Database is already empty.")
        
    conn.close()

if __name__ == "__main__":
    clear_data()
