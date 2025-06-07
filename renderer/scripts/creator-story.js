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

// ajoute un objet utilisable
async function addObject(){
    await API('createObject');
    chargeObjects();
    navGlobal();
}

async function chargeObjects(){
    let objects = await API('getObjects');
    
    let ensembleObjects = document.getElementById('ensemble-objects');
    let htmlObjects = ''
    let listType = ['invisible', 'visible']

    objects.forEach(object => {
        htmlObjects += '<li>'
        htmlObjects += '<input type="text" id="name-object-' + object.idobject + '" onchange="updateObjectName(' + object.idobject + ')" value="' + object.name + '">'
        htmlObjects += '<textarea id="description-object-' + object.idobject + '" onchange="updateObjectDescription(' + object.idobject + ')">' + object.description + '</textarea>'
        
        htmlObjects +='<select onchange="updateObjectType(' + object.idobject + ')" id="type-object-' + object.idobject + '">'
        
        for (let x = 0; x < listType.length; x++) {
            let isSelected = '';
            if(object.type == x){
                isSelected = 'selected';
            }
            htmlObjects += "<option value='" + x + "' " + isSelected + ">" + listType[x] + "</option>"
        }
        htmlObjects += "</select>";
        
        htmlObjects += '<button class="button-red" onclick="deleteObject(' + object.idobject + ')">Supprimer</button>'
        htmlObjects += '</li>'
    });
    ensembleObjects.innerHTML = htmlObjects
}

async function exportStory(){
    await API('exportStory');
}

async function updateModeStory(){
    let mode = document.getElementById('button-mode').value;
    let paramRPGmode = document.getElementById('rpg-mode');
    if(!mode){
        return
    }
    await API('updateModeStory', mode);

    if(mode == 1){
        paramRPGmode.style.display="flex";
    }else{
        
        paramRPGmode.style.display="none";
    }
    navGlobal();
}

async function updateObjectName(idObject){
    let name = document.getElementById('name-object-' + idObject).value;
    name = name.trim();
    name = name.substring(0, 50);

    document.getElementById('name-object-' + idObject).value = name
    
    if(!name || name == ''){
        return
    }

    let value = {
        name: name,
        idObject: idObject
    };
    await API('updateObjectName', value);
    navGlobal();
}

async function updateObjectDescription(idObject){
    let description = document.getElementById('description-object-' + idObject).value;
    
    let value = {
        description: description,
        idObject: idObject
    };
    API('updateObjectDescription', value);
    navGlobal();
}

async function updateObjectType(idObject){
    let type = document.getElementById('type-object-' + idObject).value;

    let value = {
        type: type,
        idObject: idObject
    };
    await API('updateObjectType', value);
    navGlobal();
}

async function updateLifeStory(){
    let life = document.getElementById('life-value').value;
    if(!life){
        return
    }
    await API('updateLifeStory', life);

    navGlobal();
}

async function deleteObject(idObject){
    await API('deleteObject', idObject);
    chargeObjects();
    navGlobal();
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

    let chaptersGlobal = document.getElementById('chaptersGlobal');
    let chaptersOrphelin = document.getElementById('chaptersOrphelin');
    let HTMLchapters = '';

    let posichapters = createTableau(chapters);

    // affichage des chapitres
    HTMLchapters += '<tbody>';
    posichapters[0].forEach(lignChapters =>{
        HTMLchapters += '<tr>';
        lignChapters.forEach(chapter =>{
            HTMLchapters += '<td>';

            if( chapter && chapter.idchapter){
                let classList = "creator-chapter ";
                if(chapter.init){
                    classList += "init-chapter ";
                }
                HTMLchapters += "<button class='" + classList + "' id='chapter-" + chapter.idchapter + "' onmouseout='unhoverChapterTab()' onmouseover='hoverChapterTab(" + chapter.idchapter + ", \"" + chapter.nextchapters + "\")' onclick='goTo(5, " + chapter.idstory + ", " + chapter.idchapter + ")'>" + chapter.name + "</button>"
            }
            HTMLchapters += '</td>';
        })

        HTMLchapters += '</tr>';
    })
    HTMLchapters += '</tbody>';

    chaptersGlobal.innerHTML = HTMLchapters;


    // affichage des chapitres orphelins
    HTMLchapters = '';
    HTMLchapters += '<tbody>';
    posichapters[1].forEach(chapter =>{
        HTMLchapters += '<tr><td>';
        if(chapter.idchapter){
            HTMLchapters += "<button class='creator-chapter orphelin-chapter' onclick='goTo(5, " + chapter.idstory + ", " + chapter.idchapter + ")'>" + chapter.name + "</button>"
        }
        HTMLchapters += '</td></tr>';
    })
    HTMLchapters += '</tbody>'

    chaptersOrphelin.innerHTML = HTMLchapters;
    chaptersLines(posichapters[0]);
}

function chaptersLines(posiChapters) {
    let svg = document.getElementById("chapterPaths");
    svg.innerHTML = "";
  
    let wrapper = document.querySelector(".chapterPrincipal");
    let container = document.querySelector(".table-chapters");
    
    let containerRect = wrapper.getBoundingClientRect();
  
    let width = wrapper.scrollWidth;
    let height = wrapper.scrollHeight;
  
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.style.width = width + "px";
    svg.style.height = height + "px";
  
    let chapters = [];
  
    posiChapters.forEach(lignChapters => {
        if(lignChapters){

            lignChapters.forEach(chapter => {
                if (chapter && chapter.idchapter) {
                chapters.push(chapter);
                }
            });
        }
    });
  
    chapters.forEach(chap => {
        if (chap.nextchapters) {
            let fromBtn = wrapper.querySelector(`#chapter-${chap.idchapter}`);
            if (!fromBtn) {
                return;
            }
    
            let fromRect = fromBtn.getBoundingClientRect();
            let fromX = (fromRect.left - containerRect.left + fromRect.width / 2) + container.scrollLeft;
            let fromY = (fromRect.bottom - containerRect.top) + container.scrollTop;
    
            let nextchapters = chap.nextchapters.split(',').map(Number);
            nextchapters.forEach(nextId => {
                let toBtn = wrapper.querySelector(`#chapter-${nextId}`);
                if (!toBtn) {
                    return;
                }

                let toRect = toBtn.getBoundingClientRect();
                let toX = toRect.left - containerRect.left + toRect.width / 2 ;
                let toY = toRect.top - containerRect.top;
        
                let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", fromX);
                line.setAttribute("y1", fromY);
                line.setAttribute("x2", toX);
                line.setAttribute("y2", toY);
                line.setAttribute("stroke", "black");
                line.setAttribute("stroke-width", "2");
                line.setAttribute("stroke-opacity", "1");
                line.setAttribute("vector-effect", "non-scaling-stroke");
                line.setAttribute("stroke-linecap", "round");
                line.setAttribute("class", "line-" + chap.idchapter);
        
                svg.appendChild(line);
            });
        }
    });
  }

function hoverChapterTab(idchapter, nextchapters){
    let chapterPathsHover = document.getElementById('chapterPathsHover');
    let lines = document.getElementsByClassName('line-' + idchapter);
    let idNextChapters = nextchapters.split(',').map(Number);

    for (let i = 0; i < lines.length; i++) {
        let lineHover = lines[i].cloneNode(true);
        lineHover.setAttribute('x1', parseFloat(lines[i].getAttribute("x1")) -0.5);
        lineHover.setAttribute('y1', parseFloat(lines[i].getAttribute("y1")) );
        lineHover.setAttribute('x2', parseFloat(lines[i].getAttribute("x2")) -0.5);
        lineHover.setAttribute('y2', parseFloat(lines[i].getAttribute("y2")) );
        lineHover.setAttribute("class", 'lineHover-' + idchapter);
        lineHover.setAttribute("stroke", "#F4A261");
        lineHover.setAttribute("stroke-width", "4");
        chapterPathsHover.appendChild(lineHover);
    }

    idNextChapters.forEach(idChapter => {
        document.getElementById('chapter-' + idChapter).classList.add("next-chapter");
    });
}

function unhoverChapterTab(){
    document.getElementById('chapterPathsHover').innerHTML = '';
    let nextChapters = document.getElementsByClassName('next-chapter');

    Array.from(nextChapters).forEach(nextChapter => {
        nextChapter.classList.remove('next-chapter');
    });
}

function placeNextChapter(posichapterGlobal, chapter, x, y){
    y++;
    
    if(posichapterGlobal && posichapterGlobal[x]){
        
        if( posichapterGlobal[x][y] && !posichapterGlobal[x][y].idchapter){
            posichapterGlobal[x][y] = chapter;
            return posichapterGlobal;
        }
    
        // si la place à attribuer est déja prise -> deplace vers le bas
        if(posichapterGlobal[x][y] && posichapterGlobal[x][y].idchapter){

            for (let ix = x+1; ix <= posichapterGlobal[x].length; ix++) {
                
                for (let iy = 0; iy < y+1; iy++) {
                    if(posichapterGlobal[ix] && !posichapterGlobal[ix][iy]){
                        posichapterGlobal[ix][iy] = {};
                    }  
                }
                if(posichapterGlobal[ix] && !posichapterGlobal[ix][y] ){
                    posichapterGlobal[ix][y] = chapter;
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
                if(posichapterGlobal[x][y] && posichapterGlobal[x][y] != undefined && posichapterGlobal[x][y].idchapter == chapter.idchapter){
                    return posichapterGlobal;
                }

                // si le chapitre est référencé pour après, le place 
                if(posichapterGlobal[x][y].nextchapters && posichapterGlobal[x][y].nextchapters != null){  
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
                chapter.init = true;
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
    posichapterGlobal.reverse();
    let posichaptersFinal = [];
    
    //tourne le tableau de 90deg
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
    let buttonMode = document.getElementById('button-mode');
    let paramRPGmode = document.getElementById('rpg-mode');
    let buttonLife = document.getElementById('life-value');

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

    let htmlMode = ''
    let modeList = [
        'Mode Classique',
        'Mode RPG'
    ]

    for (let x = 0; x < modeList.length; x++) {
        let isSelected = '';
        if(story.rpgmode && story.rpgmode == x){
            isSelected = 'selected';
        }
        htmlMode += "<option value='" + x + "' " + isSelected + ">" + modeList[x] + "</option>"
    }
    buttonMode.innerHTML = htmlMode;

    if(story.rpgmode && story.rpgmode == 1){
        paramRPGmode.style.display="flex";
    }

    if(story.life){
    buttonLife.value = story.life
    }

    chargeChapters();
    chargeObjects();
}
  
chargePage();