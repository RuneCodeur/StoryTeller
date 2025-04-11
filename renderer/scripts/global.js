async function navigation(page = 0){
  let layout = null
  switch (page) {
    case 1: // liste des histoires
      console.log('affiche la liste des histoires pretes');
      break;
      
    case 2: // liste des histoires a creer 
      console.log('affiche la liste des histoires a creer');
      break;
    
    case 3: // options
      showPage('option');
      break;
  
    default: //page d'accueil
      showPage();
      break;
  }
}

async function showPage(page = "accueil"){
  let pathHtml = "./pages/" + page + ".html"
  let pathScript = "./scripts/" + page + ".js"

  //chargement de la page html
  layout = await fetch(pathHtml).then(res => res.text());
  if(layout){
    document.getElementById("content").innerHTML = layout;
  }

  // suppression de tout les scripts dynamiques
  let dynamicScripts = document.querySelectorAll("script[data-dynamic]");
  dynamicScripts.forEach((s) => s.remove());

  // chargement deu script, si il existe
  try {
    let testScript = await fetch(pathScript);
    if (testScript.ok) {
      let script = document.createElement("script");
      script.src = pathScript;
      script.setAttribute("data-dynamic", "true");
      document.body.appendChild(script);
    }
  } catch (e) {
    console.log("aucun script à charger pour" + page);
  }
}

navigation();