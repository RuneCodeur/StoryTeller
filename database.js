const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { app } = require("electron");

const dbPath = path.join(app.getPath("userData"), "storyteller.db");
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            
            db.run("PRAGMA foreign_keys = ON");
            
            db.run(
                `CREATE TABLE IF NOT EXISTS storys (
                    idstory INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(255) NOT NULL,
                    ready INTEGER DEFAULT 0,
                    rpgmode INTEGER DEFAULT 0,
                    life INTEGER DEFAULT 1
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
                    giveobject INTEGER DEFAULT NULL,
                    requireobject INTEGER DEFAULT NULL,
                    lostlife INTEGER DEFAULT 0,
                    FOREIGN KEY(idstory) REFERENCES storys(idstory) ON DELETE CASCADE,
                    FOREIGN KEY(idchapter) REFERENCES chapters(idchapter) ON DELETE CASCADE,
                    FOREIGN KEY(nextchapter) REFERENCES chapters(idchapter) ON DELETE SET NULL,
                    FOREIGN KEY(giveobject) REFERENCES objects(idobject) ON DELETE SET NULL,
                    FOREIGN KEY(requireobject) REFERENCES objects(idobject) ON DELETE SET NULL
                )`
            );

            db.run(
                `CREATE TABLE IF NOT EXISTS objects (
                    idobject INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    type INTEGER DEFAULT 1,
                    idstory INTEGER,
                    FOREIGN KEY(idstory) REFERENCES storys(idstory) ON DELETE CASCADE
                )`
            );

            db.run(
                `CREATE TABLE IF NOT EXISTS texteffects (
                    idtexteffect INTEGER PRIMARY KEY AUTOINCREMENT,
                    idstory INTEGER,
                    idchapter INTEGER,
                    idobject INTEGER DEFAULT NULL,
                    texte TEXT DEFAULT '',
                    positive INTEGER DEFAULT 0,
                    FOREIGN KEY(idstory) REFERENCES storys(idstory) ON DELETE CASCADE,
                    FOREIGN KEY(idchapter) REFERENCES chapters(idchapter) ON DELETE CASCADE,
                    FOREIGN KEY(idobject) REFERENCES objects(idobject) ON DELETE CASCADE
                )`
            );
        });
        resolve();
    });
}

function MAJDATAgetTables(){
    return new Promise((resolve, reject) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", (err, tables) => {
            if (err) {
                reject(err);
            }
            else{
                resolve(tables);
            }
        });
    });
}

function MAJDATAdeleteTable(table){
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM sqlite_sequence WHERE name=?`, [table], function (err1) {
            if (err1) {
                return reject(err1)
            };
          
            db.run(`DROP TABLE IF EXISTS ${table}`, function (err2) {
                if (err2) {
                    return reject(err2)
                };
                resolve();
            });
        });
    });
}

function MAJDATAgetAllRows(table){
    return new Promise((resolve, reject) => {
        let safeTableName = table.replace(/[^a-zA-Z0-9_]/g, '');
        let sql = `SELECT * FROM ${safeTableName};`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}


function MAJDATAinsertAllRows(table, rows) {
    return new Promise((resolve, reject) => {
        if (!rows || rows.length === 0) {
            return resolve();
        }
    
        db.serialize(() => {
            db.run('PRAGMA foreign_keys = OFF;');
    
            let columns = Object.keys(rows[0]);
            let placeholders = columns.map(() => '?').join(', ');
            let sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
            let request = db.prepare(sql);
    
            for (let row of rows) {
                let values = columns.map(col => row[col]);
                request.run(values);
            }
    
            request.finalize(err => {
                if (err){ 
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

// mis à jour de la BDD aux dernières règles de création
async function MAJDATAbase() {
    let tables = await MAJDATAgetTables();
    let bdd = [];
    try {
        db.run("PRAGMA foreign_keys = OFF");
        
        for (let table of tables) {
            let rows = await MAJDATAgetAllRows(table.name);
            bdd.push({ 
                name: table.name, 
                rows: rows 
            });
        }
    
        for (let table of tables) {
            await MAJDATAdeleteTable(table.name);
        }
        
        await initializeDatabase();
        
        for (let table of bdd) {
            await MAJDATAinsertAllRows(table.name, table.rows);
        }
    } catch (error) {
        console.log(error)
    }
    
    db.run("PRAGMA foreign_keys = ON");
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
        db.all("SELECT idstory, name, ready, rpgmode, life FROM storys WHERE idstory = ?", [idStory], (err, rows) => {
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

function getTexteffects(idChapter){
    return new Promise((resolve, reject) => {
        db.all("SELECT idtexteffect, texte, idobject, positive FROM texteffects WHERE idchapter = ?", [idChapter], (err, rows) => {
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
        db.all("SELECT idbutton, name, type, filelink, idchapter, nextchapter, giveobject, requireobject, lostlife FROM buttons WHERE idChapter = ?", [idChapter], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function getObjects(idStory){
    return new Promise((resolve, reject) => {
        db.all("SELECT idobject, name, description, type FROM objects WHERE idstory = ?", [idStory], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// crée une nouvelle histoire + crée un chapitre 
function createStory(value) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO storys (name, rpgmode, ready) VALUES (?, ?, ?)", [value.name, value.rpgmode, 0], async function(err) {
            if (err) {
                reject(err);
            }
            else {
                let idStory = this.lastID;
                await createChapter(idStory);
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

function updateModeStory(value){
    return new Promise((resolve, reject) => {
        db.run("UPDATE storys SET rpgmode = ? where idstory = ?", [value.mode, value.idStory], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

function updateLifeStory(value){
    return new Promise((resolve, reject) => {
        db.run("UPDATE storys SET life = ? where idstory = ?", [value.life, value.idStory], function(err) {
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

function deleteObject(idObject) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM objects WHERE idobject = ?", [idObject], function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
}

// crée un nouvel objet associé au chapitre
function createObject(idStory) {
return new Promise((resolve, reject) => {
        db.run("INSERT INTO objects (idstory, name, description) VALUES (?, ?, ?)", [idStory, 'objet', ''], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

function createTexteffect(value) {
return new Promise((resolve, reject) => {
        db.run("INSERT INTO texteffects (idstory, idchapter) VALUES (?, ?)", [value.idStory, value.idChapter], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

function updateTexteTexteffect(value){
    return new Promise((resolve, reject) => {
        db.run("UPDATE texteffects SET texte = ? where idtexteffect = ?", [value.texte, value.idtexteffect], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

function updatePositiveTexteffect(value){
    return new Promise((resolve, reject) => {
        db.run("UPDATE texteffects SET positive = ? where idtexteffect = ?", [value.positive, value.idtexteffect], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
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

function updateObjectDescription(value) {
    return new Promise((resolve, reject) => {
        
        db.run("UPDATE objects SET description = ? where idobject = ?", [value.description, value.idObject], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

function updateObjectType(value) {
    return new Promise((resolve, reject) => {
        
        db.run("UPDATE objects SET type = ? where idobject = ?", [value.type, value.idObject], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

function updateObjectName(value) {
    return new Promise((resolve, reject) => {
        
        db.run("UPDATE objects SET name = ? where idobject = ?", [value.name, value.idObject], function(err) {
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
        db.run("INSERT INTO buttons (idchapter, idstory, name, nextchapter, type) VALUES (?, ?, ?, ?, ?)", [value.idChapter, value.idStory, 'action', value.nextchapter, 0], function(err) {
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
        db.run("UPDATE buttons SET type = ?, requireobject = null, giveobject = null where idbutton = ?", [value.type, value.idButton], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

function updateButtonLostLife(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE buttons SET lostlife = ? where idbutton = ?", [value.lostlife, value.idButton], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

function updateButtonRequireObject(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE buttons SET requireobject = ? where idbutton = ?", [value.requireObject, value.idButton], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this.lastID);
            }
        });
    });
}

function updateButtonGiveObject(value) {
    return new Promise((resolve, reject) => {
        db.run("UPDATE buttons SET giveobject = ? where idbutton = ?", [value.giveObject, value.idButton], function(err) {
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
    MAJDATAbase,
    getImageChapter,
    updateImageChapter,
    deleteImageChapter,
    getReadyStorys,
    getAllStorys,
    getStory,
    getChapters,
    getTexteffects,
    getAllChapters,
    getChapter,
    getButtons,
    getObjects,
    createObject,
    createTexteffect,
    updateTexteTexteffect,
    updatePositiveTexteffect,
    createStory,
    updateStory,
    updateModeStory,
    updateLifeStory,
    updateStoryName,
    updateStoryReady,
    deleteStory,
    deleteObject,
    createChapter,
    updateChapter,
    updateObjectName,
    updateObjectDescription,
    updateObjectType,
    updateChapterName,
    updateChapterTexte,
    deleteChapter,
    createButton,
    updateButton,
    updateButtonName,
    updateButtonType,
    updateButtonLostLife,
    updateButtonRequireObject,
    updateButtonGiveObject,
    updateButtonNextChapter,
    deleteButton
};
