
import os
import re
import sqlite3
from pathlib import Path

def get_db_connection():
    conn = sqlite3.connect('/app/db/dados.db', timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    try:
        cur = get_db_connection().cursor()
        schema_path = Path('src/app/db/schema.sql')

        with open(schema_path) as f:
            schema_sql = f.read()
        
        cur.executescript(schema_sql)
        cur.connection.commit()
        cur.connection.close()

        return "Banco de dados inicializado com sucesso!"
    except Exception as e:
        return f"Erro ao inicializar o banco de dados: {str(e)}"
    # Cria as tabelas se não existirem (executa o schema.sql)

def inserir_leitura(temperatura, umidade, pressao=None):
    try:
        cur = get_db_connection().cursor()
        cur.execute('INSERT INTO "leituras" (temperatura, umidade, pressao) VALUES (?, ?, ?)', (temperatura, umidade, pressao))
        cur.connection.commit()
        cur.connection.close()
        return "Leitura inserida com sucesso!"
    except Exception as err:
        return  f"Erro ao inserir leitura no banco de dados: {str(err)}"

def listar_leituras(limite=50):
    try:
        cur = get_db_connection().cursor()
        cur.execute('SELECT * FROM "leituras" ORDER BY id DESC LIMIT ?', (limite,))
        leituras = cur.fetchall()
        cur.connection.close()
        return leituras
    except Exception as err:
        return  f"Erro ao listar leituras: {str(err)}"


def buscar_leitura(id):
    try:
        cur = get_db_connection().cursor()
        cur.execute('SELECT * FROM "leituras" WHERE id = ?', (id,))
        leitura = cur.fetchone()
        cur.connection.close()
        return leitura
    except Exception as err:
        return  f"Erro ao buscar leitura: {str(err)}"


def atualizar_leitura(id, dados):
    try:
        cur = get_db_connection().cursor()
        cur.execute('UPDATE "leituras" SET temperatura = ?, umidade = ?, pressao = ? WHERE id = ?', (*dados, id))
        cur.connection.commit()
        cur.connection.close()
        return "Leitura atualizada com sucesso!"
    except Exception as err:
        return  f"Erro ao atualizar leitura: {str(err)}"


def deletar_leitura(id):
    try:
        cur = get_db_connection().cursor()
        cur.execute('DELETE FROM "leituras" WHERE id = ?', (id,))
        cur.connection.commit()
        cur.connection.close()
        return "Leitura deletada com sucesso!"
    except Exception as err:
        return  f"Erro ao deletar leitura: {str(err)}"
