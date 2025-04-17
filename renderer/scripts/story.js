async function transition(){
  let transition = document.getElementById('transition');

  transition.classList.remove('transition-inactive');
  transition.classList.add('transition-active');

  setTimeout(function() { 
    transition.classList.remove('transition-active');
    transition.classList.add('transition-inactive');
  }, 2200); 
}

async function showImage(){
  let screenImage = document.getElementById('screen-image');
  let idChapter = await window.electronAPI.getIdChapter();

  // chapitre en cours
  if(idChapter){
    let chapter = await window.electronAPI.getChapter();
    let imageFolder = await window.electronAPI.getImageFolder();

    let file = imageFolder + "\\" + chapter.imagelink;
    let isFile = await window.electronAPI.isFileExist(file);
  
    if(isFile){
      screenImage.innerHTML = '<img src="' + file + '">';
    }
  }

  // init
  else{
    let story = await window.electronAPI.getStory();
    screenImage.innerHTML = "<h1>" + story.name + "</h1>";
  }
  
}

async function showTexte(){
  let screenTexte = document.getElementById('screen-texte');
  let idChapter = await window.electronAPI.getIdChapter();
  let texte = '';

  // chapitre en cours
  if(idChapter){
    let chapter = await window.electronAPI.getChapter();
    texte = chapter.texte.replace(/\n/g, "<br>");
  }

  screenTexte.innerHTML = texte
}

async function showAction(){
  let screenAction = document.getElementById('screen-action');
  let idChapter = await window.electronAPI.getIdChapter();
  let buttonsHTML = ''

  // chapitre en cours
  if(idChapter){
    let buttons = await window.electronAPI.getButtons();
  
    if(buttons.length == 0){
      buttonsHTML = '<button onclick="endStory()"> Fin de l\'histoire </button>'
    }
    else{
      buttons.forEach(button => {
        buttonsHTML += '<button class="button-hover" onclick="nextChapter(' + button.nextchapter + ')">' + button.name + '</button>'
      });
    }
  }

  // init
  else{
    buttonsHTML = "<button class='button-hover button-red' onclick='goTo(1)'> Retour </button> <button class='button-hover ' onclick='nextChapter()'> Chapitre 1 </button>";
  }
  screenAction.innerHTML = buttonsHTML;
}


// chapitre suivant
async function nextChapter(idButton = null){
  let idStory = await window.electronAPI.getIdStory();

  if(idButton == null){
    let chapters = await window.electronAPI.getChapters();
    idButton = chapters[0].idchapter;
  }

  let info ={
    page: 6,
    idStory: idStory,
    idChapter: idButton,
    screen:idScreen
  }
  transition();
  
  setTimeout(function() { 
    window.electronAPI.navGlobal(info);
    chargePage()
  }, 900);
}

// fin de l'histoire, go sur l'écran de démarage
function endStory(){
  goTo(1);
}

async function chargePage(){
  let idStory = await window.electronAPI.getIdStory();
  let modeScreen = await window.electronAPI.getModeScreen();
  document.getElementById('story').className = "mode"+modeScreen;
  

  if( !idStory ){
    goTo(1);
  }

  switch (modeScreen) {
    case 2: // mode 2 ecrans

      // ecran principal
      if(idScreen == "page-main"){
        showImage();
      }

      // ecran secondaire
      if(idScreen == "page-2"){
        showTexte();
        showAction();
      }

      break;

    case 1: // mode 1 écran
    default:
      showImage();
      showTexte();
      showAction();
      break;
  }
  
}

chargePage()