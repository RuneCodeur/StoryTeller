async function chargePage(){
  window.electronAPI.getReadyStorys().then((value) => {
    let ensembleStorys = document.getElementById('ensemble-storys');
    let storys = ''

    value.forEach(story => {
        storys += "<li><button class='story' onclick='goTo(6, " + story.idstory + ")'>" + story.name + " </button></li>"
    });

    ensembleStorys.innerHTML = storys;
  });
}

chargePage()