// suppression du chapitre
async function deleteChapter(){
    window.electronAPI.getIdChapter().then(async (idChapter) => {
        
        await window.electronAPI.deleteImageChapter(idChapter);
        window.electronAPI.deleteChapter(idChapter).then( async () => {
            let idStory =  await window.electronAPI.getIdStory();
            goTo(4, idStory);
        })
    })
}

// maj du nom du chapitre
function updateChapterName(){
    let name = document.getElementById('name-chapter').value
    if(!name){
        return
    }
    window.electronAPI.updateChapterName(name);
    navGlobal();
}

// maj du texte du chapitre
function updateChapterTexte(){
    let texte = document.getElementById('texte-chapter').value;
    window.electronAPI.updateChapterTexte(texte);
    navGlobal();
}

// maj de l'image du chapitre
async function updateImageChapter(){
    let file = await window.electronAPI.selectImageFile();
    let idChapter = await window.electronAPI.getIdChapter();
    let idStory = await window.electronAPI.getIdStory();

    if (!file || !file.filePath || !file.fileName || !idChapter || !idStory ) {
        return;
    }

    await window.electronAPI.deleteImageChapter(idChapter);
    await window.electronAPI.updateImageChapter(file);
    chargePage();
    navGlobal();
}

// ajout d'un bouton
function createButton(){
    window.electronAPI.createButton().then(() => {
        chargeButtons();
    })
    navGlobal();
}

// suppression d'un bouton
function deleteButton(idButton){
    window.electronAPI.deleteButton(idButton).then(() => {
        chargeButtons();
    })
    navGlobal();
}

// maj du texte d'un bouton
function updateButtonName(idButton){
    let value = {
        name: document.getElementById('button-name-' + idButton).value,
        idButton: idButton
    };
    window.electronAPI.updateButtonName(value);
    navGlobal();
}

// maj du type d'un bouton
function updateButtonType(idButton){
    let value = {
        type: document.getElementById('button-type-' + idButton).value,
        idButton: idButton
    };
    window.electronAPI.updateButtonType(value);
    chargeButtons();
    navGlobal();
}

// maj du prochain chapitre d'un bouton
function updateButtonNextChapter(idButton){
    let value = {
        nextChapter: document.getElementById('button-redirect-' + idButton).value,
        idButton: idButton
    };

    window.electronAPI.updateButtonNextChapter(value);
    chargeButtons();
    navGlobal();
}

// charge les boutons
async function chargeButtons(){
    window.electronAPI.getButtons().then((value) => {
        window.electronAPI.getChapters().then((chapters) => {
            let buttons = '';
            let ensembleButons = document.getElementById('ensemble-butons');
            let typeChoice = ['redirection'];
            let maxChapters = chapters.length;
            value.forEach(button => {

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

                buttons += '<li><input type="text" onkeyup="updateButtonName(' + button.idbutton + ')" onchange="updateButtonName(' + button.idbutton + ')" class="button-name" id="button-name-' + button.idbutton + '" value="' + button.name + '">' + selectButton + buttonAction + '<button class="button-red" onclick="deleteButton(' + button.idbutton + ')">supprimer</button></li>'
            });
            ensembleButons.innerHTML = buttons;
        })
    })
}

async function chargePage(){
    window.electronAPI.getChapter().then(async function (chapter) {

        let imageFolder = await window.electronAPI.getImageFolder();
        let file = imageFolder + "\\" + chapter.imagelink;
        let isFile = await window.electronAPI.isFileExist(file);

        document.getElementById('position-chapter').innerText = "Chapitre " + chapter.positionChapter;
        document.getElementById('name-chapter').value = chapter.name;
        document.getElementById('texte-chapter').value = chapter.texte;
        document.getElementById('return').setAttribute("onclick", 'goTo(4, '+ chapter.idstory + ')');
        

        if(isFile){
            document.getElementById('image-preview').src = file;
        }
        chargeButtons();
    })
}
  
chargePage();