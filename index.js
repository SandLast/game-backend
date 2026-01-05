const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Sukuriame SQLite DB (sukurs automatiškai db.sqlite failą)
const db = new sqlite3.Database("./db.sqlite");

// Sukuriame lentelę ir įdedame žaidimus
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )`);

  const stmt = db.prepare("INSERT INTO games (name) VALUES (?)");
  const games = ["FIFA 23", "Red Dead Redemption 2", "Split Fiction"];

  games.forEach((g) => stmt.run(g));
  stmt.finalize();
});

// API: /list - visi žaidimai, su search parametru
app.get("/list", (req, res) => {
  const search = req.query.search;
  let query = "SELECT * FROM games";
  let params = [];

  if (search) {
    query += " WHERE name LIKE ?";
    params.push(`%${search}%`);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
