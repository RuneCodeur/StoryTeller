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
  let messageStory = await API('getMessageStory');
  let texte = '';

  // chapitre en cours
  if(idChapter){
    let chapter = await API('getChapter');

    if(messageStory != ''){
      texte += '<p class="message-story">' + messageStory.replace(/\n/g, "<br>") + '<p>';
    }

    texte += '<p>' + chapter.texte.replace(/\n/g, "<br>") + '<p>';

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

async function showInventory(){
  let screenInventory = document.getElementById('screen-inventory');
  let inventory = await API('getInventory');
  let Objects = await API('getObjects');
  let htmlInventory = '';
  if(inventory.length > 0){
    htmlInventory += '<p>Inventaire</p>';
    htmlInventory += '<ul>';
    
    inventory.forEach(item => {
      for (let i = 0; i < Objects.length; i++) {
        if(Objects[i] && Objects[i].idobject && Objects[i].idobject == item && Objects[i].type == 1){
          htmlInventory += '<li>' + Objects[i].name + '</li>';
          break;
        }
      }
    });
    
    htmlInventory += '</ul>';
    screenInventory.innerHTML = htmlInventory;
  }

}

async function showLife(){
  let screenLife = document.getElementById('screen-life');
  let life = await API('getLife');

  screenLife.innerHTML = '<p>❤️: ' + life + '</p>';
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
  let message ='';

  if(idButton == null){
    let chapters = await API('getChapters');
    await API('initInventory');
    nextChapter = chapters[0].idchapter;
    
  }
  
  else{
    let button = await API('getButton', idButton);
    life = await API('getLife');
   

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

    // message 
    if(button && button.message){
      message = button.message;
    }
  }

  let info ={
    page: 6,
    idStory: story.idstory,
    idChapter: nextChapter,
    screen: idScreen,
    giveObject: idGiveObject,
    deleteObject: idDeleteObject,
    life: life,
    messageStory: message
  }
  
  API('navGlobal', info);
  chargePage();
}

// fin de l'histoire, go sur l'écran de démarage
function endStory(){
  goTo(1);
}

async function gameOver(){
  let screenImage = document.getElementById('screen-image');
  let screenAction = document.getElementById('screen-action');
  let screenTexte = document.getElementById('screen-texte');
  let screenInventory = document.getElementById('screen-inventory');
  let messageStory = await API('getMessageStory');
  let imageHTML = '';
  let buttonsHTML = '';

  imageHTML = "<h1>💔 Fin de la partie 💔</h1>";
  
  if(messageStory != ''){
    imageHTML += '<p class="message-story">' + messageStory  + '</p>'
  }
  
  buttonsHTML = '<button class="end-story" onclick="endStory()"> Fin </button>';
  buttonsHTML += '<button class="end-story" onclick="restartStory()"> Recommencer </button>';

  screenImage.innerHTML = imageHTML
  screenAction.innerHTML = buttonsHTML;
  screenTexte.innerHTML = '';
  screenInventory.innerHTML = '';
}

async function restartStory(){
  let idStory = await API('getIdStory');
  transition();
  await API('initInventory');
  await pause(900);
  goTo(6, idStory)
}

async function chargePage(){
  let story = await API('getStory');
  let idChapter = await API('getIdChapter');
  let modeScreen = await API('getModeScreen');

  if( !story.idstory ){
    goTo(1);
  }
  
  if(idChapter){
    transition();
    await pause(900);
  }
  
  else if( !idChapter && story.rpgmode && story.life){
    await API('setLife', story.life)
  }
  
  document.getElementById('story').className = "mode" + modeScreen;

  if(story.rpgmode && idChapter){
    let life = await API('getLife');
    if(life <= 0){
      showLife();
      gameOver();
      return;
    }
  }

  switch (modeScreen) {
    case 3: // mode 1 ecrans + telephone

      // ecran principal
      if(idScreen == "page-main"){
        showImage();
        if(story.rpgmode){
          showLife();
        }
      }

      // ecran secondaire
      if(idScreen == "page-mobile"){
        showTexte();
        showAction();
        if(story.rpgmode){
          showLife();
          showInventory();
        }
      }

      break;
    case 2: // mode 2 ecrans

      // ecran principal
      if(idScreen == "page-main"){
        showImage();
        if(story.rpgmode){
          showLife();
        }
      }

      // ecran secondaire
      if(idScreen == "page-2"){
        showTexte();
        showAction();
        if(story.rpgmode){
          showLife();
          showInventory();
        }
      }

      break;

    case 1: // mode 1 écran
    default:
      showImage();
      showTexte();
      showAction();
      if(story.rpgmode){
          showLife();
          showInventory();
        }
      break;
  }
}

chargePage()