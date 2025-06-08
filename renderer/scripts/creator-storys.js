async function createStory(){
    let nameNewStory = document.getElementById('text-new-story').value;
    let rpgmodeNewStory = document.getElementById('rpgmode-new-story').value;
    if(!nameNewStory){
        return;
    }
    let value = {
        name: nameNewStory,
        rpgmode: rpgmodeNewStory
    }

    await API('createStory', value);
    document.getElementById('text-new-story').value = "";
    chargePage();
}

async function importStory(){
    await API('importStory');
    chargePage();
}

async function chargePage(){
    let storys = await API('getAllStorys');
    let multiMode = true;
    let ensembleStorys = document.getElementById('ensemble-storys');
    let buttonMode = document.getElementById('rpgmode-new-story');
    let HTMLstorys = ''
    let htmlMode = ''
    
    let modeList = [
        'Mode Classique',
        'Mode RPG'
    ]

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

    if(multiMode){
        for (let x = 0; x < modeList.length; x++) {
            let isSelected = '';
            if(x == 0){
                isSelected = 'selected';
            }
            htmlMode += "<option value='" + x + "' " + isSelected + ">" + modeList[x] + "</option>"
        }
        buttonMode.innerHTML = htmlMode;
        buttonMode.style.display='flex';
    }

}
  
chargePage();