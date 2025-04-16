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
                FOREIGN KEY(idstory) REFERENCES storys(idstory) ON DELETE CASCADE
            )`
        );

        db.run(
            `CREATE TABLE IF NOT EXISTS buttons (
                idbutton INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                type TINYINT,
                filelink VARCHAR(255),
                idstory INTEGER,
                idchapter INTEGER,
                nextchapter INTEGER,
                FOREIGN KEY(idstory) REFERENCES storys(idstory) ON DELETE CASCADE,
                FOREIGN KEY(idchapter) REFERENCES chapters(idchapter) ON DELETE CASCADE,
                FOREIGN KEY(nextchapter) REFERENCES chapters(idchapter) ON DELETE SET NULL
            )`
        );

    });
}

// récupère les histoires prêtes
function getReadyStorys() {
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

// récupère toutes les histoires
function getAllStorys(){
    return new Promise((resolve, reject) => {
        db.all("SELECT idstory, name, ready FROM storys", [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// récupère 1 histoire
function getStory(idStory){
    return new Promise((resolve, reject) => {
        db.all("SELECT idstory, name, ready FROM storys WHERE idstory = ?", [idStory], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows[0]);
            }
        });
    });
}

// récupère tout les chapitres de 1 histoire
function getChapters(idStory){
    return new Promise((resolve, reject) => {
        db.all("SELECT idchapter, idstory FROM chapters WHERE idstory = ?", [idStory], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// crée une nouvelle histoire + crée un chapitre 
function createStory(name) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO storys (name, ready) VALUES (?, ?)", [name, 0], function(err) {
            if (err) {
                reject(err);
            }
            else {
                let idStory = this.lastID;
                createChapter(idStory);
                resolve(idStory);
            }
        });
    });
}

// maj de 1 histoire
function updateStory(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE storys SET name = ?, ready = ? where idstory = ?", [value.name, value.isReady, value.idStory], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

// supprime 1 histoire
function deleteStory(idStory) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM storys WHERE idstory = ?", [idStory], function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
}


// crée un nouveau chapitre
function createChapter(idStory) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO chapters (idStory, name) VALUES (?, ?)", [idStory, ''], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

// met à jour 1 chapitre
function updateChapter(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE chapters SET name = ?, texte = ? where idchapter = ?", [value.name, value.texte, value.idChapter], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

// supprime 1 chapitre (sauf si c'est le dernier)
function deleteChapter(idChapter) {
    return new Promise((resolve, reject) => {
        db.get("SELECT idstory FROM chapters WHERE idchapter = ?", [idChapter], (err, row) => {
            if (err) {
                return reject(err);
            }
            if (!row) {
                return reject(new Error("Chapitre introuvable"))
            };

            let idStory = row.idstory;

            db.get("SELECT COUNT(*) AS count FROM chapters WHERE idstory = ?", [idStory], (err, countRow) => {
                if (err) {
                    return reject(err)
                };

                if (countRow.count <= 1) {
                    return reject(new Error("Impossible de supprimer le dernier chapitre de l'histoire."));
                }

                db.run("DELETE FROM chapters WHERE idchapter = ?", [idChapter], function(err) {
                    if (err) {
                        return reject(err)
                    };
                    resolve();
                });
            });
        });
    });
}

module.exports = {
    initializeDatabase,
    getReadyStorys,
    getAllStorys,
    getStory,
    getChapters,
    createStory,
    updateStory,
    deleteStory,
    createChapter,
    updateChapter,
    deleteChapter
};
