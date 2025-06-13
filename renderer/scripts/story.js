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
  
  let idChapter = await API('getIdChapter'); 

  // chapitre en cours
  if(idChapter){
    let chapter = await API('getChapter');
    let imageFolder = await API('getImageFolder');

    let file = imageFolder + "\\" + chapter.imagelink;
    let isFile = await API('isFileExist', file); 
  
    if(isFile){
      screenImage.innerHTML = '<img src="' + file + '">';
    }
    else{
      screenImage.innerHTML = '';
    }
  }

  // init
  else{
    let story = await API('getStory');
    screenImage.innerHTML = "<h1>" + story.name + "</h1>";
  }
  
}

async function showTexte(){
  let screenTexte = document.getElementById('screen-texte');
  let idChapter = await API('getIdChapter');
  let texte = '';

  // chapitre en cours
  if(idChapter){
    let chapter = await API('getChapter');
    texte = '<p>' + chapter.texte.replace(/\n/g, "<br>") + '<p>';

    if(chapter.rpgmode && chapter.rpgmode == 1){
      let inventory = await API('getInventory')
      let texteffects = await API('getTexteffects');
      
      texteffects.forEach(texteffect => {
        let objectFound = false;

        for (let i = 0; i < inventory.length; i++) {
          if(inventory[i] && inventory[i].idobject && inventory[i].idobject == texteffect.idobject){
            objectFound = true;
            break;
          }
        }

        if((objectFound && texteffect.positive == 0) || (!objectFound && texteffect.positive == 1)){
          texte += '<p class="texteffect" >' + texteffect.texte.replace(/\n/g, "<br>") + '</p>';
        }
      
        
      });
    }
  }

  screenTexte.innerHTML = texte
}

async function showAction(){
  let screenAction = document.getElementById('screen-action');
  let idChapter = await API('getIdChapter');
  let buttonsHTML = ''

  // chapitre en cours
  if(idChapter){
    let buttons = await API('getButtons');
  
    if(buttons.length == 0){
      buttonsHTML = '<button class="end-story" onclick="endStory()"> Fin de l\'histoire </button>'
      buttonsHTML += '<button class="end-story" onclick="restartStory()"> Recommencer </button>'
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
  let idStory = await API('getIdStory');

  if(idButton == null){
    let chapters = await API('getChapters');
    idButton = chapters[0].idchapter;
  }

  let info ={
    page: 6,
    idStory: idStory,
    idChapter: idButton,
    screen:idScreen
  }
  
  API('navGlobal', info);
  chargePage();
}

// fin de l'histoire, go sur l'écran de démarage
function endStory(){
  goTo(1);
}

async function restartStory(){
  let idStory = await API('getIdStory');
  transition();
  await pause(900);
  goTo(6, idStory)
}

async function chargePage(){
  let idStory = await API('getIdStory');
  let idChapter = await API('getIdChapter');
  let modeScreen = await API('getModeScreen');
  await API('initInventory');
  
  if(idChapter){
    transition();
    await pause(900);
  }
  
  document.getElementById('story').className = "mode" + modeScreen;

  if( !idStory ){
    goTo(1);
  }

  switch (modeScreen) {
    case 3: // mode 1 ecrans + telephone

      // ecran principal
      if(idScreen == "page-main"){
        showImage();
      }

      // ecran secondaire
      if(idScreen == "page-mobile"){
        showTexte();
        showAction();
      }

      break;
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