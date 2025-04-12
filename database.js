const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { app } = require("electron");

const dbPath = path.join(app.getPath("userData"), "storys.db");
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
    db.serialize(() => {
        
        db.run("PRAGMA foreign_keys = ON");
        
        db.run(
            `CREATE TABLE IF NOT EXISTS storys (
                idstory INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                ready INTEGER DEFAULT 0
            )`
        );

        db.run(
            `CREATE TABLE IF NOT EXISTS chapters (
                idchapter INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                texte TEXT,
                imagelink VARCHAR(255),
                idstory INTEGER,
                chapter INTEGER,
                FOREIGN KEY(idstory) REFERENCES storys(idstory) ON DELETE CASCADE,
                UNIQUE(idstory, chapter)
            )`
        );

        db.run(
            `CREATE TABLE IF NOT EXISTS buttons (
                idbutton INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                type TINYINT,
                filelink VARCHAR(255),
                idstory INTEGER,
                nextchapter INTEGER,
                chapter INTEGER,
                FOREIGN KEY(idstory) REFERENCES storys(idstory) ON DELETE CASCADE
            )`
        );

    });
  }

//récupère les histoires prêtes
function getReadyStories() {
  return new Promise((resolve, reject) => {
    db.all("SELECT idstory, name FROM storys WHERE ready = 1", [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// crée une nouvelle histoire
function createStory(name) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO storys (name, ready) VALUES (?, ?)", [name, 0], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

function deleteStory(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM storys WHERE id = ?", [id], function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = {
    initializeDatabase,
    getReadyStories,
    createStory,
    deleteStory,
};
