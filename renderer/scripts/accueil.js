function quitApp(){
  API("quitApp");
}

async function loadVersion(){
  let version = await API('getVERSION');
  document.getElementById('version').innerHTML = "V " + version
}

async function chargePage() {
  loadVersion();
}

chargePage();