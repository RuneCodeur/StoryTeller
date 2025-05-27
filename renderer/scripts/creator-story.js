// supprimer l'histoire
async function deleteStory(){
    let idStory = await API('getIdStory');
    await API('deleteStory', idStory);
    goTo(4);
}

// ajouter un chapitre
async function addChapter(){
    await API('createChapter');
    chargeChapters();
    navGlobal();
}

async function exportStory(){
    await API('exportStory');
}

// maj du nom de la story
async function updateStoryName(){
    let name = document.getElementById('name-story').value
    if(!name){
        return
    }
    await API('updateStoryName', name);
    navGlobal();
}

// maj du statut complet ou incomplet
async function updateIsReady(){
    let buttonIsReady = document.getElementById('button-is-ready');
    let isReady = buttonIsReady.dataset.ready;
    value = 1;
    if(isReady == 1){
        value = 0;
    }
    document.getElementById('button-is-ready').dataset.ready = value;
    await API('updateStoryReady', value);
    navGlobal();
    chargePage();
}

// charge les chapitres
async function chargeChapters(){
    let chapters = await API('getChapters');

    let ensembleChapters = document.getElementById('ensemble-chapters');
    let positionChapter = 0;
    let HTMLchapters = '';

    let posichapters = createTableau(chapters);

    consoleLog(posichapters[0]); //++++++++++++++++++++++++++++++
    
    chapters = await API('getChapters');
    chapters.forEach(chapter => {
        positionChapter ++;
        HTMLchapters += "<li><button class='creator-chapter' onclick='goTo(5, " + chapter.idstory + ", " + chapter.idchapter + ")'>" + positionChapter + "</button></li>";
    });
    ensembleChapters.innerHTML = HTMLchapters;

}

function placeNextChapter(posichapterGlobal, chapter, x, y){
    y++;
    
    if(posichapterGlobal && posichapterGlobal[x]){
        
        if( posichapterGlobal[x][y] && !posichapterGlobal[x][y].idchapter){
            posichapterGlobal[x][y] = chapter;
            return posichapterGlobal;
        }
    
        if(posichapterGlobal[x][y] && posichapterGlobal[x][y].idchapter){

            for (let i = x+1; i <= posichapterGlobal[x].length; i++) {
                
                if(posichapterGlobal[i] && !posichapterGlobal[i][y] ){
                    posichapterGlobal[i][y] = chapter;
                    return posichapterGlobal;
                }
            }

            x = posichapterGlobal.length;
            posichapterGlobal[x] = [];
        }

        if(posichapterGlobal[x].length <= y+1 ){
            for (let i = 0; i < y+1; i++) {
                if(!posichapterGlobal[x][i]){
                    posichapterGlobal[x][i] = {};
                }
                if(i == y){
                    posichapterGlobal[x][i] = chapter;
                    return posichapterGlobal;
                }
            }
        }
    }
    return posichapterGlobal;
}

function findChapter(posichapterGlobal, chapter){
    
    for (let x = 0; x < posichapterGlobal.length; x++) {
        if(posichapterGlobal[x]){
            for (let y = 0; y < posichapterGlobal[x].length; y++) {
                // si le chapitre existe déja, return
                if(posichapterGlobal[x][y] && posichapterGlobal[x][y].idchapter == chapter.idchapter){
                    return posichapterGlobal;
                }

                // si le chapitre est référencé pour après, le place
                if(posichapterGlobal[x][y].nextchapters){
                    let nextChapters = posichapterGlobal[x][y].nextchapters.split(',').map(Number);
                    for (let idN = 0; idN <= nextChapters.length; idN++) {

                        if(nextChapters[idN] == chapter.idchapter){
                            posichapterGlobal = placeNextChapter(posichapterGlobal, chapter, x, y);
                            return posichapterGlobal;
                        }
                    }
                }

            }
        }
    }
    return null;
}

function createTableau(chapters, tableauInit = []){
    let boucle = true;
    let posichapterGlobalTemp = chapters;
    let posichapterGlobal = tableauInit;
    let posichapterGlobalOrphelin = [];
    
    // place les chapitres principaux
    while (boucle) {
        let chapter = null;
        
        if(posichapterGlobalTemp[0]){
            chapter = posichapterGlobalTemp[0];

            // si le chapitre global est vide, le place à 0,0 et suivant
            if(posichapterGlobal.length == 0){
                posichapterGlobal[0] = []
                posichapterGlobal[0][0] = chapter;
                posichapterGlobalTemp.shift();
                continue;
            }
            else{
                
                //cherche si il existe dans le tableau
                let posichapter = findChapter(posichapterGlobal, chapter)
                if(posichapter){
                    posichapterGlobal = posichapter;
                }

                // si pas trouvé -> orphelin et next
                else{
                    posichapterGlobalOrphelin.push(chapter);
                }

                posichapterGlobalTemp.shift();
            }
        }
        else{
            boucle = false;
        }
    }

    // gestion des orphelins
    boucle = true;
    while(boucle){
        let chapter = null;
        boucle = false;

        for (let ic = 0; ic < posichapterGlobalOrphelin.length; ic++) {
            if(boucle == false){

                chapter = posichapterGlobalOrphelin[ic];
                
                for (let x = 0; x < posichapterGlobal.length; x++) {
                    for (let y = 0; y < posichapterGlobal[x].length; y++) {
                        if(posichapterGlobal[x][y] && posichapterGlobal[x][y].nextchapters){
                            let nextChapters = posichapterGlobal[x][y].nextchapters.split(',').map(Number);
                            for (let idN = 0; idN <= nextChapters.length; idN++) {
    
                                if(nextChapters[idN] == chapter.idchapter){
                                    posichapterGlobal = placeNextChapter(posichapterGlobal, chapter, x, y);
                                    posichapterGlobalOrphelin.splice(ic, 1);
                                    boucle = true;
                                }

                            }
                        }
                    }
                }

            }
            
        }
    }

    let maxLength = 0;
    for (let i = 0; i < posichapterGlobal.length; i++) {
        if (posichapterGlobal[i].length > maxLength) {
            maxLength = posichapterGlobal[i].length;
        }
    }

    for (let i = 0; i < posichapterGlobal.length; i++) {
        while (posichapterGlobal[i].length < maxLength) {
            posichapterGlobal[i].push({});
        }
    }

    let posichaptersFinal = [];
    
    for (let y = 0; y < posichapterGlobal[0].length; y++) {
        let newRow = [];
        for (let x = posichapterGlobal.length - 1; x >= 0; x--) {
            newRow.push(posichapterGlobal[x][y]);
        }
        posichaptersFinal.push(newRow);
    }

    return [posichaptersFinal, posichapterGlobalOrphelin];
}

async function chargePage(){
    let story = await API('getStory');
    
    document.getElementById('name-story').value = story.name;
    let buttonIsReady = document.getElementById('button-is-ready');

    buttonIsReady.classList.remove("red");
    buttonIsReady.classList.remove("green");

    let colorIsReady = "red"
    let textIsReady = "incomplet"
    if(story.ready == 1){
        colorIsReady = "green"
        textIsReady = "complet"
    }
    buttonIsReady.classList.add(colorIsReady);
    buttonIsReady.innerText = textIsReady;
    buttonIsReady.dataset.ready = story.ready;

    chargeChapters();
}
  
chargePage();