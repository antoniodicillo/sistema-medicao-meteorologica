CREATE TABLE IF NOT EXISTS leituras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temperatura REAL NOT NULL,
    umidade REAL NOT NULL,
    pressao REAL, -- opcional
    localizacao TEXT DEFAULT 'Lab', -- opcional
    timestamp DATETIME DEFAULT (datetime('now','localtime'))
);