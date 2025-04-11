function fullScreen(isCheck = false){
  window.electronAPI.setFullscreen(isCheck);
}

async function chargePage(){
  let checkboxFullScreen = document.getElementById("checkboxFullScreen");

  window.electronAPI.getFullscreen().then((value) => {
    checkboxFullScreen.checked = value;
  });
}

chargePage()