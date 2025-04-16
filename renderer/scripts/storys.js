async function chargePage(){
  window.electronAPI.getReadyStorys().then((value) => {
    consoleLog(value);
  });
}

chargePage()