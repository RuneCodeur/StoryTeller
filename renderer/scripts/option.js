function setWifiName(value){
  consoleLog(value);
  window.electronAPI.setWifiName(value);
  document.getElementById("wifiName").value = value;
  navGlobal();
}

function fullScreen(isCheck = false){
  window.electronAPI.setFullscreen(isCheck);
  navGlobal();
}

function updateVolume(value){
  window.electronAPI.setVolume(value);
  document.getElementById("numberVolume").innerText = value;
  navGlobal();
}

function openMobileScreenQrcode(){
  window.electronAPI.openMobileScreenQrcode();
  navGlobal();
}

function open2Screens() {
  window.electronAPI.open2Screens();
  navGlobal();
}

function open1Screen(){
  window.electronAPI.open1Screen();
}

function openScreenMobile() {
  consoleLog('lance le screen mobile')
}

async function chargePage(){
  let checkboxFullScreen = document.getElementById("checkboxFullScreen");
  let inputVolume = document.getElementById("inputVolume");
  let numberVolume = document.getElementById("numberVolume");
  let wifiName = document.getElementById("wifiName");

  window.electronAPI.getFullscreen().then((value) => {
    checkboxFullScreen.checked = value;
  });
  
  window.electronAPI.getVolume().then((value) => {
    inputVolume.value = value;
    numberVolume.innerText = value;
  });
  
  window.electronAPI.getWifiName().then((value) => {
    wifiName.value = value;
  });

}

chargePage()