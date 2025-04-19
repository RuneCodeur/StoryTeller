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
    chapters.forEach(chapter => {
        positionChapter ++;
        HTMLchapters += "<li><button class='creator-chapter' onclick='goTo(5, " + chapter.idstory + ", " + chapter.idchapter + ")'>" + positionChapter + "</button></li>";
    });
    ensembleChapters.innerHTML = HTMLchapters;

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