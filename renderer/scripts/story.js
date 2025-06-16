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
      let inventory = await API('getInventory');
      let texteffects = await API('getTexteffects');
      
      texteffects.forEach(texteffect => {
        let objectFound = false;

        for (let i = 0; i < inventory.length; i++) {
          if(inventory[i] != undefined && inventory[i] == texteffect.idobject){
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
  let buttonsHTML = '';

  // chapitre en cours
  if(idChapter){
    let buttons = await API('getButtons');
    let inventory = await API('getInventory');
  
    buttons.forEach(button => {
      let show = true;

      // si requireobject et que requireobject est présent dans l'inventaire -> affiche le bouton
      if(button.requireobject != null){
        show = false;
        for (let i = 0; i < inventory.length; i++) {
          if(inventory[i] && inventory[i] == button.requireobject){
            show = true;
            break;
          }
        }
      }

      // si l'objet est deja présent dans l'inventaire -> n'affiche pas le bouton
      if(button.giveobject != null){
        for (let i = 0; i < inventory.length; i++) {
          if(inventory[i] && inventory[i] == button.giveobject){
            show = false;
            break;
          }
        }
      }

      if(show){
        buttonsHTML += '<button class="button-hover" onclick="actionButon(' + button.idbutton + ')">' + button.name + '</button>';
      }
    });

    if(buttonsHTML == ''){
      buttonsHTML = '<button class="end-story" onclick="endStory()"> Fin de l\'histoire </button>';
      buttonsHTML += '<button class="end-story" onclick="restartStory()"> Recommencer </button>';
    }
  }

  // init
  else{
    buttonsHTML = "<button class='button-hover button-red' onclick='goTo(1)'> Retour </button> <button class='button-hover ' onclick='actionButon()'> Chapitre 1 </button>";
  }
  screenAction.innerHTML = buttonsHTML;
}


// chapitre suivant
async function actionButon(idButton = null){
  let story = await API('getStory');
  let nextChapter = null;
  let idGiveObject = null;
  let idDeleteObject = null;
  let life = story.life;

  if(idButton == null){
    let chapters = await API('getChapters');
    await API('initInventory');
    nextChapter = chapters[0].idchapter;
    
  }
  
  else{
    let button = await API('getButton', idButton);
   

    // chapitre suivant
    if(button && button.nextchapter){
      nextChapter = button.nextchapter;
    }
    
    // gain d'objet
    if(button && button.giveobject){
      idGiveObject = button.giveobject;
    }

    // perte d'objet
    if(button && button.requireobject && (button.type == 3 || button.type == 2)){
      idDeleteObject = button.requireobject;
    }

    // perte de vie
    if(button && button.lostlife){
      life = life - button.lostlife;
      if(life < 0){
        life = 0;
      }
    }
  }

  let info ={
    page: 6,
    idStory: story.idstory,
    idChapter: nextChapter,
    screen: idScreen,
    giveObject: idGiveObject,
    deleteObject: idDeleteObject,
    life: life
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