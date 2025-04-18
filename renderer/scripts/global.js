var currentPage = 0;
var idStory = null;
var idChapter = null;
const idScreen = document.body.id;

async function consoleLog(message){
  window.electronAPI.sendMessage(message);
}

window.electronAPI.reloadPage((info) => {
  // consoleLog(info);
  currentPage = info.page;
  idStory = info.idStory;
  idChapter = info.idChapter;
  navigation(info.page, info.idStory, info.idChapter);
});

function goTo(page = 0, story = null, chapter = null){
  currentPage = page;
  idStory = story;
  idChapter = chapter;
  navigation(page, story, chapter);
  navGlobal();
}

function navGlobal(){
  let info = {
    page: currentPage,
    idStory: idStory,
    idChapter: idChapter,
    screen:idScreen
  }
  window.electronAPI.navGlobal(info);
}

async function navigation(page = 0, story = null, chapter){
  let modeScreen = await window.electronAPI.getModeScreen();

  if(idScreen == "page-2"){
    if(modeScreen == 3){
      page = 7;
    }
  }

  switch (page) {
    case 1: // liste des histoires
      showPage('storys');
      break;
      
    case 2: // liste des histoires a creer 
      showPage('creator-storys');
      break;
    
    case 3: // options
      showPage('option');
      break;

    case 4: // histoire en mode création
      if(story == null){
        showPage('creator-storys');
      }
      else{
        showPage('creator-story');
      }
      break;
      
    case 5: // chapitre en mode création
      if(story == null || chapter == null){
        showPage('creator-storys');
      }
      else{
        showPage('creator-chapter');
      }
      break;

    case 6: // lecture de l'histoire
      if(story == null ){
        showPage('storys');
      }
      else{
        showPage('story');
      }
      break;
    case 7: // affiche le qrcode pour la version mobile
      showPage('qrcode');
      break;
  
    default: //page d'accueil
      showPage();
      break;
  }
  currentPage = page;
}

async function showPage(page = "accueil"){
  let pathHtml = "./pages/" + page + ".html"
  let pathScript = "./scripts/" + page + ".js"

  //chargement de la page html
  layout = await fetch(pathHtml).then(res => res.text());
  if(layout){
    document.getElementById("content").innerHTML = layout;
  }

  // suppression de tout les scripts dynamiques
  let dynamicScripts = document.querySelectorAll("script[data-dynamic]");
  dynamicScripts.forEach((s) => s.remove());

  // chargement deu script, si il existe
  try {
    let testScript = await fetch(pathScript);
    if (testScript.ok) {
      let script = document.createElement("script");
      script.src = pathScript;
      script.setAttribute("data-dynamic", "true");
      document.body.appendChild(script);
    }
  } catch (e) {
    consoleLog("aucun script à charger pour " + page);
  }
}

function loading(){
  if(idScreen != 'page-main'){
    window.electronAPI.getPage().then((value) => {
      navigation(value.page, value.story, value.chapter);
    });
  }
  else{
    navigation();
  }
}

loading();