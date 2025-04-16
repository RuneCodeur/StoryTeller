// envoie de la maj de l'histoire
function updateStory(){
    window.electronAPI.getIdStory().then((idStory) => {
        let isReady = document.getElementById('button-is-ready').dataset.ready;
        if(!isReady){
            isReady = 0;
        }
        let value = {
            idStory: idStory,
            name: document.getElementById('name-story').value,
            isReady: isReady
        }
        window.electronAPI.updateStory(value).then(() => {
            chargePage();
        })
    })
    navGlobal();
}

// supprimer l'histoire
function deleteStory(){
    window.electronAPI.getIdStory().then((idStory) => {
        window.electronAPI.deleteStory(idStory).then(() => {
            goTo(4);
        })
    })
}

// ajouter un chapitre
function addChapter(){
    window.electronAPI.createChapter().then(() => {
        chargeChapters();
    });
    navGlobal();
}

// maj du nom de la story
function updateStoryName(){
    let name = document.getElementById('name-story').value
    if(!name){
        return
    }
    updateStory()
}

// maj du statut complet ou incomplet
function updateIsReady(){
    let buttonIsReady = document.getElementById('button-is-ready');
    let isReady = buttonIsReady.dataset.ready;
    value = 1;
    if(isReady == 1){
        value = 0;
    }
    document.getElementById('button-is-ready').dataset.ready = value;
    updateStory();
}

// charge les chapitres
function chargeChapters(){
    window.electronAPI.getChapters().then((value) => {
        let ensembleChapters = document.getElementById('ensemble-chapters');
        let num = 0;
        let chapters = '';
        value.forEach(chapter => {
            num ++;
            chapters += "<li><button class='creator-chapter' onclick='goTo(5, " + chapter.idstory + ", " + chapter.idchapter + ")'>" + num + "</button></li>";
        });
        ensembleChapters.innerHTML = chapters;
    })
}

async function chargePage(){
    window.electronAPI.getStory().then((value) => {
        document.getElementById('name-story').value = value.name;
        let buttonIsReady = document.getElementById('button-is-ready');

        buttonIsReady.classList.remove("red");
        buttonIsReady.classList.remove("green");

        let colorIsReady = "red"
        let textIsReady = "incomplet"
        if(value.ready == 1){
            colorIsReady = "green"
            textIsReady = "complet"
        }
        buttonIsReady.classList.add(colorIsReady);
        buttonIsReady.innerText = textIsReady;
        buttonIsReady.dataset.ready = value.ready;

        chargeChapters();
    })
}
  
chargePage();