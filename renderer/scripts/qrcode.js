async function chargePage(){
    let qrcode = await window.electronAPI.getQrcodeMobile();
    let wifiName = await window.electronAPI.getWifiName();
    if(qrcode){
        document.getElementById('qrcode-image').src = qrcode;
    }
    if( wifiName){
        document.getElementById('wifi-name').innerText = wifiName
    }
}
  
chargePage()