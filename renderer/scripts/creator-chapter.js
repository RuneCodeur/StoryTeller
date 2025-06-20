// suppression du chapitre
async function deleteChapter(){
    let idChapter = await API('getIdChapter');

    await API('deleteChapter', idChapter);
    let idStory =  await API('getIdStory');
    goTo(4, idStory);
}

// maj du nom du chapitre
function updateChapterName(){
    let name = document.getElementById('name-chapter').value;
    name = name.trim();
    name = name.substring(0, 50);
    document.getElementById('name-chapter').value = name;
    if(!name || name == ''){
        return;
    }
    API('updateChapterName', name);
    navGlobal();
}

// maj du texte du chapitre
function updateChapterTexte(){
    let texte = document.getElementById('texte-chapter').value;
    API('updateChapterTexte', texte);
    navGlobal();
}

// maj de l'image du chapitre
async function updateImageChapter(){
    let file = await API('selectImageFile');
    let idChapter = await API('getIdChapter');
    let idStory = await API('getIdStory');

    if (!file || !file.filePath || !file.fileName || !idChapter || !idStory ) {
        return;
    }

    await API('updateImageChapter',file);
    chargePage();
    navGlobal();
}

// ajout d'un bouton
async function createButton(){
    let chapters = await API('getChapters');
    let idNextChapter = null;

    if(chapters[0].idchapter){
        idNextChapter = chapters[0].idchapter;
    }
    
    await API('createButton', idNextChapter);
    chargeButtons();
    navGlobal();
}

async function createTexteffect(){
    await API('createTexteffect');
    chargeTextEffects();
    navGlobal();
}

// suppression d'un bouton
async function deleteButton(idButton){
    await API('deleteButton', idButton);
    chargeButtons();
    navGlobal();
}

// maj du texte d'un bouton
async function updateButtonName(idButton){

    let name = document.getElementById('button-name-' + idButton).value;
    name = name.trim();
    name = name.substring(0, 50);
    document.getElementById('button-name-' + idButton).value = name;
    if(!name || name == ''){
        return;
    }

    let value = {
        name: name,
        idButton: idButton
    };
    await API('updateButtonName', value);
    navGlobal();
}

// maj du type d'un bouton
async function updateButtonType(idButton){
    let value = {
        type: document.getElementById('button-type-' + idButton).value,
        idButton: idButton
    };
    await API('updateButtonType', value);
    chargeButtons();
    navGlobal();
}

async function updateLostLife(idButton){
    let value = {
        lostlife: document.getElementById('button-lostlife-' + idButton).value,
        idButton: idButton
    };
    await API('updateButtonLostLife', value);
    chargeButtons();
    navGlobal();
}

async function updateObject( idButton, action){
    if(action == 1){
        let value = {
            requireObject: document.getElementById('button-action-object-' + idButton + '-' + action).value,
            idButton: idButton
        };
        await API('updateButtonRequireObject', value);
    }
    else if(action == 2){
        let value = {
            giveObject: document.getElementById('button-action-object-' + idButton + '-' + action).value,
            idButton: idButton
        };
        await API('updateButtonGiveObject', value);
    }
}

// maj du prochain chapitre d'un bouton
async function updateButtonNextChapter(idButton){
    let value = {
        nextChapter: document.getElementById('button-redirect-' + idButton).value,
        idButton: idButton
    };
    await API('updateButtonNextChapter', value);
    chargeButtons();
    navGlobal();
}

async function updateTexteTexteffect(idTexteffect){
    let value = {
        texte: document.getElementById('texte-texteffect-' + idTexteffect).value,
        idTexteffect: idTexteffect
    };
    await API('updateTexteTexteffect', value);
    navGlobal();
}

async function updatePositiveTexteffect(idTexteffect){
    let value = {
        positive: document.getElementById('positive-texteffect-' + idTexteffect).value,
        idTexteffect: idTexteffect
    };
    await API('updatePositiveTexteffect', value);
    navGlobal();
}

async function updateButtonMessage(idButton){
    let value = {
        message: document.getElementById('button-message-' + idButton).value,
        idButton: idButton
    };
    
    await API('updateButtonMessage', value);
    chargeButtons();
    navGlobal();
}

async function updateObjectTexteffect(idTexteffect){
    let value = {
        idObject: document.getElementById('object-texteffect-' + idTexteffect).value,
        idTexteffect: idTexteffect
    };
    await API('updateObjectTexteffect', value);
    navGlobal();
}

async function deleteTexteffect(idTexteffect){
    await API('deleteTexteffect', idTexteffect);
    chargeTextEffects();
    navGlobal();
}

async function chargeTextEffects(){
    let texteffects = await API('getTexteffects');
    let objects = await API('getObjects');
    objects.unshift({idobject: 'null', name:'---'});

    let HTMLtexteffects = ''
    let listPositive = ['apparait', 'disparait'];

    texteffects.forEach(texteffect => {
        let HTMLselectPositive = '';
        let HTMLObjects = '';
        HTMLtexteffects += '<li>';

        HTMLtexteffects += '<textarea id="texte-texteffect-'+texteffect.idtexteffect+'" onkeyup="updateTexteTexteffect('+texteffect.idtexteffect+')" onchange="updateTexteTexteffect('+texteffect.idtexteffect+')" >'+texteffect.texte+'</textarea>';

        HTMLselectPositive = '<select onchange="updatePositiveTexteffect(' + texteffect.idtexteffect + ')" class="button-type" id="positive-texteffect-' + texteffect.idtexteffect + '">';
        for (let x = 0; x < listPositive.length; x++) {
            let isSelected = '';
            if(texteffect.positive == x){
                isSelected = 'selected';
            }
            HTMLselectPositive += "<option value='" + x + "' " + isSelected + ">" + listPositive[x] + "</option>";
        }
        HTMLselectPositive += "</select>";

        HTMLObjects = '<select onchange="updateObjectTexteffect(' + texteffect.idtexteffect + ')" class="button-type" id="object-texteffect-' + texteffect.idtexteffect + '">';
        for (let x = 0; x < objects.length; x++) {
            let isSelected = '';
            if(texteffect.idobject == objects[x].idobject){
                isSelected = 'selected';
            }
            HTMLObjects += "<option value='" +  objects[x].idobject + "' " + isSelected + ">" +  objects[x].name + "</option>";
        }
        HTMLObjects += "</select>";

        HTMLtexteffects += '<div class="ensemble-param-texteffect"><p>le texte </p>' + HTMLselectPositive + '<p> avec l\'objet : </p>' + HTMLObjects + ' </div>';
        HTMLtexteffects += '<button class="button-red" onclick="deleteTexteffect(' + texteffect.idtexteffect + ')">Supprimer</button>';
        HTMLtexteffects += '</li>';
    });
    document.getElementById('ensemble-texteffects').innerHTML = HTMLtexteffects;
}

// charge les boutons
async function chargeButtons(){
    let buttons = await API('getButtons');
    let chapters = await API('getChapters');
    let story = await API('getStory');
    let objects = await API('getObjects');
    objects.unshift({idobject: 'null', name:'---'});
    
    let HTMLbuttons = '';
    let ensembleButons = document.getElementById('ensemble-butons');
    let typeChoice = ['redirection', 'gain objet', 'perte objet', 'echange d\'objet', 'objet requis', 'perte de vie'];
    let maxChapters = chapters.length;
    let rpgMode = 0;

    if(story.rpgmode && story.rpgmode == 1){
        rpgMode = 1
    }

    buttons.forEach(button => {

        let selectButton = ''
        let buttonAction = '';
        let buttonRedirection = '';
        let redirection = false;

        // mode multi-type de bouton
        if(rpgMode != 0){

            selectButton = '<select onchange="updateButtonType(' + button.idbutton + ')" class="button-type" id="button-type-' + button.idbutton + '">';

            for (let x = 0; x < typeChoice.length; x++) {
                let isSelected = '';
                if(button.type == x){
                    isSelected = 'selected';
                }
                selectButton += "<option value='" + x + "' " + isSelected + ">" + typeChoice[x] + "</option>";
            }
            selectButton += "</select>";
            
        }
        else{
            button.type = 0;
        }

        switch (button.type) {

            case 6: // audio
                buttonAction += '<button>audio</button> <button>changer</button>';
            break;

            case 5: // perte de vie
                buttonAction += '<div class="ensemble-button-action"><p>Perte de vie</p> <input type="number" onchange="updateLostLife(' + button.idbutton + ')" id="button-lostlife-' + button.idbutton + '" class="button-lostlife" min="1" max="100" value="' + button.lostlife+ '"></div>';
                buttonAction += '<div class="ensemble-button-action"><p>Message de perte de vie</p> <textarea id="button-message-' + button.idbutton + '" onchange="updateButtonMessage(' + button.idbutton + ')">'+ button.message +'</textarea></div>';
                redirection = true;
            break;

            case 4: // objet requis
                buttonAction += buttonObject('objet requis', 1, button.idbutton, objects, button.requireobject);
                redirection = true;
            break;
            
            case 3: // echange
                buttonAction += buttonObject('objet à donner (perdu)', 1, button.idbutton, objects, button.requireobject);
                buttonAction += buttonObject('gain', 2, button.idbutton, objects, button.giveobject);
                redirection = true;
            break;

            case 2: // perte objet
                buttonAction += buttonObject('objet requis (perdu)', 1, button.idbutton, objects, button.requireobject);
                redirection = true;
            break;

            case 1: // gain objet
                buttonAction += buttonObject('gain', 2, button.idbutton, objects, button.giveobject);
                redirection = true;
            break;

            case 0: // simple redirection
            default:
                redirection = true;
            break;
        }

        if(redirection){
            buttonRedirection += '<div class="ensemble-next-chapter"><p> chapitre suivant </p> <select onchange="updateButtonNextChapter(' + button.idbutton + ')" class="button-redirect" id="button-redirect-' + button.idbutton + '">';
            for (let x = 0; x < maxChapters; x++) {
                let isSelected = '';
                if(button.nextchapter == chapters[x].idchapter){
                    isSelected = 'selected';
                }
                buttonRedirection += "<option value='" + chapters[x].idchapter + "' " + isSelected + ">" + chapters[x].name + "</option>";
            }
            buttonRedirection += "</select>";
            buttonRedirection += "</div>";
        }

        HTMLbuttons += '<li><input type="text" onchange="updateButtonName(' + button.idbutton + ')" class="button-name" id="button-name-' + button.idbutton + '" value="' + button.name + '">' + selectButton + buttonAction + buttonRedirection + '<button class="button-red" onclick="deleteButton(' + button.idbutton + ')">Supprimer le bouton</button></li>';
    });
    ensembleButons.innerHTML = HTMLbuttons;
}

function buttonObject(name, action, idButton, objects, idObject){
    let html = '';
    html += '<div class="ensemble-button-action"><p>' + name + '</p> <select onchange="updateObject(' + idButton + ', ' + action + ')" class="button-redirect" id="button-action-object-' + idButton + '-' + action + '">';
    for (let x = 0; x < objects.length; x++) {
        let isSelected = '';
        if(idObject && objects[x].idobject == idObject){
            isSelected = 'selected';
        }
        html += "<option value='" + objects[x].idobject + "' " + isSelected + ">" + objects[x].name + "</option>";
    }
    html += "</select>";
    html += "</div>";

    return html;
}

async function chargePage(){
    let story = await API('getStory');
    let chapter = await API('getChapter');

    let imageFolder = await API('getImageFolder');
    let file = imageFolder + "\\" + chapter.imagelink;
    let isFile = await API('isFileExist', file);
    let texteffects = document.getElementById('global-ensemble-texteffects');

    document.getElementById('position-chapter').innerText = "Chapitre " + chapter.positionChapter;
    document.getElementById('name-chapter').value = chapter.name;
    document.getElementById('texte-chapter').value = chapter.texte;
    document.getElementById('return').setAttribute("onclick", 'goTo(4, '+ chapter.idstory + ')');
    

    if(isFile){
        document.getElementById('image-preview').src = file;
    }
    
    if(idScreen == 'page-mobile'){
        document.getElementsByClassName('ensemble-image')[0].style.display = 'none';
        document.getElementsByClassName('ensemble-image-mobile')[0].style.display = 'flex';
    }else{
        document.getElementsByClassName('ensemble-image')[0].style.display = 'flex';
        document.getElementsByClassName('ensemble-image-mobile')[0].style.display = 'none';
    }

    if(story.rpgmode && story.rpgmode == 1){
        texteffects.style.display = "flex";
        chargeTextEffects()
    }else{
        texteffects.style.display = "none";
    }

    chargeButtons();
}
  
chargePage();