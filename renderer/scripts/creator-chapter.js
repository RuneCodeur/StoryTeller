async function chargePage(){
    window.electronAPI.getChapter().then((value) => {
        consoleLog(value);
    })
}
  
chargePage();