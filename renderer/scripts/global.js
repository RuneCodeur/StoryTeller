let currentPage = 0;
let idStory = null;
let idChapter = null;
const idScreen = document.body.id;

async function consoleLog(message){
  window.electronAPI.sendMessage(message);
}

window.electronAPI.reloadPage((info) => {
  consoleLog(info);
  navigation(info.page);
});


function goTo(page = 0, story = null, chapter = null){
  currentPage = page;
  idStory = story;
  idChapter = chapter
  navigation(page, story, chapter);
  navGlobal();
}

function navGlobal(){
  let info = {
    page: currentPage,
    idStory: idStory,
    numChapter: idChapter,
    screen:idScreen
  }
  window.electronAPI.navGlobal(info);
}

async function navigation(page = 0, story = null, chapter){
  switch (page) {
    case 1: // liste des histoires
      consoleLog('affiche la liste des histoires pretes');
      showPage('storys');
      break;
      
    case 2: // liste des histoires a creer 
      consoleLog('affiche la liste des histoires a creer');
      showPage('creator-storys');
      break;
    
    case 3: // options
      consoleLog('affiche les options');
      showPage('option');
      break;

    case 4: // histoire en mode création
      consoleLog('affiche lhistoire numero ' + story + ' (mode creation)');
      if(story == null){
        showPage('creator-storys');
      }
      else{
        showPage('creator-story');
      }
      break;
  
    default: //page d'accueil
      consoleLog('affiche la page principale');
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
    consoleLog("aucun script à charger pour" + page);
  }
}

function loading(){
  navigation();
  if(idScreen != 'page-main'){
    window.electronAPI.getPage().then((value) => {
      navigation(value);
    });
  }
}

loading();