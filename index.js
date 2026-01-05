const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000; // Render dažnai naudoja PORT env

app.use(cors());
app.use(express.json());

// Sukuriame SQLite DB (jeigu failas neegzistuoja)
const db = new sqlite3.Database("./db.sqlite", (err) => {
    if (err) console.error("DB error:", err.message);
    else console.log("Connected to SQLite DB.");
});

// Sukuriame lentelę ir įdedame žaidimus tik jei nėra
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )`);

    db.all("SELECT COUNT(*) AS count FROM games", [], (err, rows) => {
        if (err) return console.error(err.message);

        if (rows[0].count === 0) {
            const stmt = db.prepare("INSERT INTO games (name) VALUES (?)");
            const games = ["FIFA 23", "Red Dead Redemption 2", "Split Fiction"];
            games.forEach((g) => stmt.run(g));
            stmt.finalize();
            console.log("Inserted initial games.");
        }
    });
});

// API: /list - visi žaidimai arba pagal search
app.get("/list", (req, res) => {
    const search = req.query.search?.toLowerCase() || "";

    db.all("SELECT * FROM games", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Fuzzy search, case-insensitive
        const filtered = rows.filter(g =>
            g.name.toLowerCase().includes(search)
        );

        res.json(filtered);
    });
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
