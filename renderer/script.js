document.getElementById('send').addEventListener('click', () => {
    window.electronAPI.sendMessage('Hello depuis le renderer !');
  });
  