async function chargePage(){
    let qrcode = await API('getQrcodeMobile'); 
    let wifiName = await API('getWifiName');
    
    if(qrcode){
        document.getElementById('qrcode-image').src = qrcode;
    }
    if( wifiName){
        document.getElementById('wifi-name').innerText = wifiName
    }
}
  
chargePage()