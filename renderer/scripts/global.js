var currentPage = 0;
var idStory = null;
var idChapter = null;
const idScreen = document.body.id;


function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function API(func, value){
  let result = ''
  if(idScreen == 'page-mobile'){
    consoleLog("communication page mobile")
  }else{
    result = await window.electronAPI[func](value);
  }
  return result;
}

async function consoleLog(message){
  API("sendMessage", message)
}

async function reloadPage(info) {

  //ne recharge pas la page si mode histoire
  if((currentPage == 6 || info.page == 6) && info.idStory == idStory){
    chargePage();
    return;
  }
  currentPage = info.page;
  idStory = info.idStory;
  idChapter = info.idChapter;
  navigation(info.page, info.idStory, info.idChapter);
}

function goTo(page = 0, story = null, chapter = null){
  currentPage = page;
  idStory = story;
  idChapter = chapter;
  navigation(page, story, chapter);
  navGlobal();
}

async function navGlobal(){
  let info = {
    page: currentPage,
    idStory: idStory,
    idChapter: idChapter,
    screen:idScreen
  }
  await API('navGlobal', info);
}

async function navigation(page = 0, story = null, chapter){
  let modeScreen = await API('getModeScreen');

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

async function loading(){
  if(idScreen != 'page-main'){
    consoleLog("value");
    let value = await API("getPage");
    consoleLog(value);
    navigation(value.page, value.story, value.chapter);
  }
  else{
    navigation();
  }
}

loading();
API("reloadPage", reloadPage);