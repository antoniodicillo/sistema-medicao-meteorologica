from pathlib import Path
from flask import Flask, request, jsonify, render_template
from .database import inserir_leitura, listar_leituras, buscar_leitura, atualizar_leitura, deletar_leitura


from .database import (
    inserir_leitura,
    listar_leituras,
    buscar_leitura,
    atualizar_leitura,
    deletar_leitura,
)

# Point Flask at: src/app/templates and src/app/static
APP_DIR = Path(__file__).resolve().parents[1]  # -> .../src/app
TEMPLATES_DIR = APP_DIR / "templates"
STATIC_DIR = APP_DIR / "static"

app = Flask(
    __name__,
    template_folder=str(TEMPLATES_DIR),
    static_folder=str(STATIC_DIR),
    static_url_path="/static",
)

# --- HTML ---

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/leituras', methods=['GET'])
def listar():
    leituras = listar_leituras()
    return render_template("historico.html")


@app.route('/leituras/<int:id>', methods=['GET'])
def detalhe(id):
    leitura = buscar_leitura(id)
    if leitura:
        return render_template("editar.html", id=id)
    else:
        return jsonify({"message": "Leitura não encontrada"}), 404
    

# --- API ---

@app.route('/leituras', methods=['POST'])
def criar():
    dados = request.get_json()
    resultado = inserir_leitura(dados['temperatura'], dados['umidade'], dados.get('pressao'))
    return jsonify({"message": resultado})



@app.route('/leituras/<int:id>', methods=['PUT'])
def atualizar(id):
    dados = request.get_json()
    resultado = atualizar_leitura(id, (dados['temperatura'], dados['umidade'], dados.get('pressao')))
    return jsonify({"message": resultado})

@app.route('/leituras/<int:id>', methods=['DELETE'])
def deletar(id):
    resultado = deletar_leitura(id)
    return jsonify({"message": resultado})

@app.route('/api/estatisticas', methods=['GET'])
def estatisticas():
    # Média, mín e máx do período
    return 
   