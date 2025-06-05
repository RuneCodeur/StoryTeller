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
                ready INTEGER DEFAULT 0,
                rpgmode INTEGER DEFAULT 0
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
                giveobject INTEGER,
                requireobject INTEGER,
                useobject INTEGER,
                FOREIGN KEY(idstory) REFERENCES storys(idstory) ON DELETE CASCADE,
                FOREIGN KEY(idchapter) REFERENCES chapters(idchapter) ON DELETE CASCADE,
                FOREIGN KEY(nextchapter) REFERENCES chapters(idchapter) ON DELETE SET NULL
            )`
        );

        db.run(
            `CREATE TABLE IF NOT EXISTS objects (
                idobject INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                visible INTEGER DEFAULT 1,
                idstory INTEGER,
                FOREIGN KEY(idstory) REFERENCES storys(idstory) ON DELETE CASCADE
            )`
        );

        db.run(
            `CREATE TABLE IF NOT EXISTS chaptertexteffects (
                idchapter INTEGER,
                idobject INTEGER,
                texte TEXT,
                positive INTEGER DEFAULT 1, -- 1 = si objet est possédé, 0 = si objet n’est PAS possédé
                FOREIGN KEY(idchapter) REFERENCES chapters(idchapter) ON DELETE CASCADE,
                FOREIGN KEY(idobject) REFERENCES objects(idobject) ON DELETE CASCADE
            )`
        );
    });
}

// récupère l'image de 1 chapitre
function getImageChapter(idChapter) {
    return new Promise((resolve, reject) => {
        db.all("SELECT imagelink FROM chapters WHERE idchapter = ?", [idChapter], (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows[0]);
            }
        });
    });
}

// met à jour l'image de 1 chapitre
function updateImageChapter(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE chapters SET imagelink = ? where idchapter = ?", [value.imageLink, value.idChapter], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

// supprime l'image du chapitre
function deleteImageChapter(idChapter) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE chapters SET imagelink = NULL where idchapter = ?", [idChapter], function(err) {
            if (err) reject(err);
            else resolve();
        });
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
        db.all("SELECT chapters.idchapter, chapters.idstory, chapters.name, chapters.imagelink, GROUP_CONCAT(buttons.nextchapter) AS nextchapters FROM chapters LEFT JOIN buttons ON buttons.idchapter = chapters.idchapter AND buttons.idstory = chapters.idstory WHERE chapters.idstory = ? GROUP BY chapters.idchapter, chapters.idstory", [idStory], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// récupère tout les chapitres de 1 histoire (complet)
function getAllChapters(idStory){
    return new Promise((resolve, reject) => {
        db.all("SELECT idchapter, name, texte, imagelink, idstory FROM chapters WHERE idstory = ?", [idStory], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// récupère le chapitre avec sa position
function getChapter(idChapter) {
    return new Promise((resolve, reject) => {
        db.get("SELECT idchapter, name, texte, imagelink, idstory FROM chapters WHERE idchapter = ?", [idChapter], (err, row) => {
            if (err) {
                return reject(err);
            }
            if (!row){
                return reject(new Error("Chapitre introuvable"));
            }

            const idStory = row.idstory;

            db.all("SELECT idchapter FROM chapters WHERE idstory = ? ORDER BY idchapter ASC", [idStory], (err, rows) => {
                if (err){
                    return reject(err);
                }

                const index = rows.findIndex(c => c.idchapter === idChapter);
                if (index === -1){
                    return reject(new Error("Chapitre non trouvé dans la liste"));
                }
                row.positionChapter = index + 1;
                resolve(row);
            });
        });
    });
}

// récupère tout les boutons du chapitre
function getButtons(idChapter){
    return new Promise((resolve, reject) => {
        db.all("SELECT idbutton, name, type, filelink, idchapter, nextchapter FROM buttons WHERE idChapter = ?", [idChapter], (err, rows) => {
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

// met à jour le nom de 1 histoire
function updateStoryName(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE storys SET name = ? where idstory = ?", [value.name, value.idStory], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

// met à jour l'etat ready de 1 histoire
function updateStoryReady(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE storys SET ready = ? where idstory = ?", [value.isReady, value.idStory], function(err) {
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

        db.all("SELECT idchapter FROM chapters WHERE idstory = ? ORDER BY idchapter ASC", [idStory], (err, rows) => {
            if (err) {
                return reject(err);
            }
            let positionChapter = rows.length+1;
            let chapterName = 'Chapitre ' + positionChapter;
            
            db.run("INSERT INTO chapters (idStory, name) VALUES (?, ?)", [idStory, chapterName], function(err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(this.lastID);
                }
            });
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

// met à jour le nom de 1 chapitre
function updateChapterName(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE chapters SET name = ? where idchapter = ?", [value.name, value.idChapter], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

// met à jour le texte de 1 chapitre
function updateChapterTexte(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE chapters SET texte = ? where idchapter = ?", [value.texte, value.idChapter], function(err) {
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
                return reject(new Error("Chapitre introuvable"));
            }

            let idStory = row.idstory;

            db.get("SELECT COUNT(*) AS count FROM chapters WHERE idstory = ?", [idStory], (err, countRow) => {
                if (err) {
                    return reject(err);
                }

                if (countRow.count <= 1) {
                    return reject(new Error("Impossible de supprimer le dernier chapitre de l'histoire."));
                }

                db.run("DELETE FROM chapters WHERE idchapter = ?", [idChapter], function(err) {
                    if (err) {
                        return reject(err);
                    };
                    resolve();
                });
            });
        });
    });
}

// crée un nouveau bouton
function createButton(value) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO buttons (idchapter, idstory, name, nextchapter) VALUES (?, ?, ?, ?)", [value.idChapter, value.idStory, 'action', value.nextchapter], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

// met à jour 1 bouton
function updateButton(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE buttons SET name = ?, type = ?, filelink = ?, nextchapter = ? where idbutton = ?", [value.name, value.type, value.filelink, value.nextChapter, value.idButton], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

// met à jour le name de 1 bouton
function updateButtonName(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE buttons SET name = ? where idbutton = ?", [value.name, value.idButton], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}


// met à jour le type de 1 bouton
function updateButtonType(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE buttons SET type = ? where idbutton = ?", [value.type, value.idButton], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

// met à jour le type de 1 bouton
function updateButtonNextChapter(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE buttons SET nextchapter = ? where idbutton = ?", [value.nextChapter, value.idButton], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

// supprime 1 bouton
function deleteButton(idButton) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM buttons WHERE idbutton = ?", [idButton], function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = {
    initializeDatabase,
    getImageChapter,
    updateImageChapter,
    deleteImageChapter,
    getReadyStorys,
    getAllStorys,
    getStory,
    getChapters,
    getAllChapters,
    getChapter,
    getButtons,
    createStory,
    updateStory,
    updateStoryName,
    updateStoryReady,
    deleteStory,
    createChapter,
    updateChapter,
    updateChapterName,
    updateChapterTexte,
    deleteChapter,
    createButton,
    updateButton,
    updateButtonName,
    updateButtonType,
    updateButtonNextChapter,
    deleteButton
};
