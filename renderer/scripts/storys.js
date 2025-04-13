async function chargePage(){
  window.electronAPI.getReadyStories().then((value) => {
    consoleLog(value);
  });
}

chargePage()