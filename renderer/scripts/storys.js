async function chargePage(){
  window.electronAPI.getreadystories().then((value) => {
    consoleLog(value);
  });
}

chargePage()