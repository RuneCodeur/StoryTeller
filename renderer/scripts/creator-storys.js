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
    window.electronAPI.getAllStorys().then((value) => {
        let ensembleStorys = document.getElementById('ensemble-storys');
        let storys = ''
        value.forEach(story => {
            let colorIsReady = "red"
            let textIsReady = "incomplet"
            if(story.ready){
                colorIsReady = "green"
                textIsReady = "complet"
            }
            storys += "<li><button class='creator-story' onclick='goTo(4, " + story.idstory + ")'><p class='title'>" + story.name + "</p><p class='is-ready " + colorIsReady + "'>" + textIsReady + "</p></button></li>"
        });
        ensembleStorys.innerHTML = storys;
    });
}
  
chargePage();