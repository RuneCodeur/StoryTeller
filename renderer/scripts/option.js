async function setWifiName(value){
  await API('setWifiName', value);
  navGlobal();
}

async function fullScreen(isCheck = false){
  await API('setFullscreen', isCheck);
  navGlobal();
}

async function updateVolume(value){
  await API('setVolume', value);
  document.getElementById("numberVolume").innerText = value;
  navGlobal();
}

async function openMobileScreenQrcode(){
  await API('openMobileScreenQrcode');
  goTo(3);
}

async function open2Screens() {
  await API('open2Screens');
  goTo(3);
}

async function open1Screen(){
  await API('open1Screen');
  goTo(3);
}

async function chargePage(){
  let checkboxFullScreen = document.getElementById("checkboxFullScreen");
  let inputVolume = document.getElementById("inputVolume");
  let numberVolume = document.getElementById("numberVolume");
  let wifiName = document.getElementById("wifiName");

  let fullScreen = await API('getFullscreen');
  let volume = await API('getVolume');
  let wifi = await API('getWifiName');

  checkboxFullScreen.checked = fullScreen;
  inputVolume.value = volume;
  numberVolume.innerText = volume;
  wifiName.value = wifi;
}

chargePage()