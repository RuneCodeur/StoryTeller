function createStory(){
    textNewStory = document.getElementById('text-new-story');
    let name = textNewStory.value;
    if(!name){
        return;
    }
    window.electronAPI.createStory(name).then(() => {
        textNewStory.value = "";
        chargePage();
    });
}

async function chargePage(){
    window.electronAPI.getAllStories().then((value) => {
        let ensembleStorys = document.getElementById('ensemble-storys');
        let storys = ''
        value.forEach(story => {
            let colorIsReady = "red"
            let textIsReady = "incomplet"
            if(story.ready){
                colorIsReady = "green"
                textIsReady = "complet"
            }
            storys += "<button onclick='showCreator(" + story.idstory + ")'><p>" + story.name + "</p><p class='is-ready " + colorIsReady + "'>" + textIsReady + "</p></button>"
        });
        ensembleStorys.innerHTML = storys;
    });
}
  
chargePage();