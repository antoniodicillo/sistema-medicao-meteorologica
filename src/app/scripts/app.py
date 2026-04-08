from pathlib import Path

from flask import Flask, jsonify, render_template, request

from .database import (
    buscar_leitura,
    deletar_leitura,
    init_db,
    inserir_leitura,
    listar_leituras,
    atualizar_leitura,
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

# Ensure DB schema exists
init_db()

# --- HTML pages ---


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/historico")
def historico():
    return render_template("historico.html")


@app.get("/editar/<int:id>")
def editar(id: int):
    return render_template("editar.html", id=id)


# --- JSON API ---


@app.get("/leituras")
def api_listar_leituras():
    limit = request.args.get("limit", default=50, type=int)
    offset = request.args.get("offset", default=0, type=int)
    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    leituras = listar_leituras(limite=limit, offset=offset)
    if isinstance(leituras, str):
        return jsonify({"message": leituras}), 500
    return jsonify([dict(row) for row in leituras])


@app.post("/leituras")
def api_criar_leitura():
    dados = request.get_json(force=True)
    resultado = inserir_leitura(dados["temperatura"], dados["umidade"], dados.get("pressao"))
    status = 200 if "sucesso" in str(resultado).lower() else 400
    return jsonify({"message": resultado}), status


@app.get("/leituras/<int:id>")
def api_detalhe_leitura(id: int):
    leitura = buscar_leitura(id)
    if isinstance(leitura, str):
        return jsonify({"message": leitura}), 500
    if leitura:
        return jsonify(dict(leitura))
    return jsonify({"message": "Leitura não encontrada"}), 404


@app.put("/leituras/<int:id>")
def api_atualizar_leitura(id: int):
    dados = request.get_json(force=True)
    resultado = atualizar_leitura(id, (dados["temperatura"], dados["umidade"], dados.get("pressao")))
    status = 200 if "sucesso" in str(resultado).lower() else 400
    return jsonify({"message": resultado}), status


@app.delete("/leituras/<int:id>")
def api_deletar_leitura(id: int):
    resultado = deletar_leitura(id)
    status = 200 if "sucesso" in str(resultado).lower() else 400
    return jsonify({"message": resultado}), status


@app.get("/api/estatisticas")
def estatisticas():
    # Média, mín e máx do período
    return jsonify({"message": "TODO"})
   