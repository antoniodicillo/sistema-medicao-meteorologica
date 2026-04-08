from flask import Flask, request, jsonify
from .database import inserir_leitura, listar_leituras, buscar_leitura, atualizar_leitura, deletar_leitura


app = Flask(__name__)


@app.route('/', methods=['GET'])
def index():
    return "<p>Bem-vindo ao sistema de medição meteorológica!</p>"


@app.route('/leituras', methods=['GET'])
def listar():
    leituras = listar_leituras()
    return jsonify([dict(leit) for leit in leituras])


@app.route('/leituras', methods=['POST'])
def criar():
    dados = request.get_json()
    resultado = inserir_leitura(dados['temperatura'], dados['umidade'], dados.get('pressao'))
    return jsonify({"message": resultado})


@app.route('/leituras/<int:id>', methods=['GET'])
def detalhe(id):
    leitura = buscar_leitura(id)
    if leitura:
        return jsonify(dict(leitura))
    else:
        return jsonify({"message": "Leitura não encontrada"}), 404
    

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
   