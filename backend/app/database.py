import pyodbc
from contextlib import contextmanager
import os
from dotenv import load_dotenv

load_dotenv()

class DatabaseConnection:
    def __init__(self):
        self.server = os.getenv("DB_SERVER", "SRVRDS22")
        self.database = os.getenv("DB_DATABASE", "MIEZAKA_TEST")
        self.username = os.getenv("DB_USERNAME", "StageInfo")
        self.password = os.getenv("DB_PASSWORD", "StageInfo")
        
    def get_connection_string(self):
        return (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={self.server};"
            f"DATABASE={self.database};"
            f"UID={self.username};"
            f"PWD={self.password};"
            f"TrustServerCertificate=yes;"
        )
    
    @contextmanager
    def get_connection(self):
        conn = None
        try:
            conn = pyodbc.connect(self.get_connection_string())
            yield conn
        except pyodbc.Error as e:
            raise Exception(f"Erreur de connexion DB: {str(e)}")
        finally:
            if conn:
                conn.close()

db = DatabaseConnection()