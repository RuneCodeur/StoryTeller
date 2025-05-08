async function createStory(){
    textNewStory = document.getElementById('text-new-story');
    let name = textNewStory.value;
    if(!name){
        return;
    }

    await API('createStory', name);
    textNewStory.value = "";
    chargePage();
}

async function importStory(){
    await API('importStory');
    chargePage();
}

async function chargePage(){
    let storys = await API('getAllStorys');
    
    let ensembleStorys = document.getElementById('ensemble-storys');
    let HTMLstorys = ''
    storys.forEach(story => {
        let colorIsReady = "red"
        let textIsReady = "incomplet"
        if(story.ready){
            colorIsReady = "green"
            textIsReady = "complet"
        }
        HTMLstorys += "<li><button class='creator-story' onclick='goTo(4, " + story.idstory + ")'><p class='title'>" + story.name + "</p><p class='is-ready " + colorIsReady + "'>" + textIsReady + "</p></button></li>"
    });
    ensembleStorys.innerHTML = HTMLstorys;
}
  
chargePage();