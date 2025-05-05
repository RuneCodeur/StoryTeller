// suppression du chapitre
async function deleteChapter(){
    let idChapter = await API('getIdChapter');

    await API('deleteChapter', idChapter);
    let idStory =  await API('getIdStory');
    goTo(4, idStory);
}

// maj du nom du chapitre
function updateChapterName(){
    let name = document.getElementById('name-chapter').value
    if(!name){
        return
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
    await API('createButton');
    chargeButtons();
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
    let value = {
        name: document.getElementById('button-name-' + idButton).value,
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

// charge les boutons
async function chargeButtons(){
    let buttons = await API('getButtons');
    let chapters = await API('getChapters');

    let HTMLbuttons = '';
    let ensembleButons = document.getElementById('ensemble-butons');
    let typeChoice = ['redirection'];
    let maxChapters = chapters.length;

    buttons.forEach(button => {

        let selectButton = ''
        let buttonAction = '';

        // mode multi-type de bouton
        if(typeChoice.length > 1){

            selectButton = '<select onchange="updateButtonType(' + button.idbutton + ')" class="button-type" id="button-type-' + button.idbutton + '">'

            for (let x = 0; x < typeChoice.length; x++) {
                let isSelected = '';
                if(button.type == x){
                    isSelected = 'selected';
                }
                selectButton += "<option value='" + x + "' " + isSelected + ">" + typeChoice[x] + "</option>"
            }
            selectButton += "</select>";
            
        }
        else{
            button.type = 0;
        }

        switch (button.type) {
            case 1: // audio
            buttonAction = '<button>audio</button> <button>changer</button>'
            break;

            case 0: // redirection
            default:
                buttonAction ='<select onchange="updateButtonNextChapter(' + button.idbutton + ')" class="button-redirect" id="button-redirect-' + button.idbutton + '">'
                for (let x = 1; x <= maxChapters; x++) {
                    let isSelected = '';
                    if(button.nextchapter == chapters[x-1].idchapter){
                        isSelected = 'selected';
                    }
                    buttonAction += "<option value='" + chapters[x-1].idchapter + "' " + isSelected + ">" + x + "</option>"
                }
                buttonAction += "</select>";
                buttonAction ="<div class='ensemble-next-chapter'><p> chapitre suivant </p>" + buttonAction +"</div>";
                break;
        }

        HTMLbuttons += '<li><input type="text" onkeyup="updateButtonName(' + button.idbutton + ')" onchange="updateButtonName(' + button.idbutton + ')" class="button-name" id="button-name-' + button.idbutton + '" value="' + button.name + '">' + selectButton + buttonAction + '<button class="button-red" onclick="deleteButton(' + button.idbutton + ')">supprimer</button></li>'
    });
    ensembleButons.innerHTML = HTMLbuttons;
}

async function chargePage(){
    let chapter = await API('getChapter');

    let imageFolder = await API('getImageFolder');
    let file = imageFolder + "\\" + chapter.imagelink;
    let isFile = await API('isFileExist', file);

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

    chargeButtons();
    
}
  
chargePage();