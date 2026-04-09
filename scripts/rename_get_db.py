import os

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace the import statement
    content = content.replace("from database.database import init_db, save_scan, init_soc_tables, get_db", 
                              "from database.database import init_db, save_scan, init_soc_tables, get_db, get_db_conn")
    content = content.replace("from database.database import get_db", "from database.database import get_db_conn")
    
    # 2. Replace connection instantiation
    content = content.replace("conn = get_db()", "conn = get_db_conn()")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f"Refactored {filepath}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(__file__))
    main_py = os.path.join(base_dir, 'backend', 'main.py')
    analytics_py = os.path.join(base_dir, 'backend', 'utils', 'analytics.py')
    
    replace_in_file(main_py)
    replace_in_file(analytics_py)
