async function chargePage(){
  let storys = await API('getReadyStorys');

  let ensembleStorys = document.getElementById('ensemble-storys');
  let HTMLstorys = ''

  storys.forEach(story => {
    HTMLstorys += "<li><button class='story' onclick='goTo(6, " + story.idstory + ")'>" + story.name + " </button></li>"
  });

  ensembleStorys.innerHTML = HTMLstorys;
}

chargePage()