const socket = io();

socket.on("fromServer", (data) => {
    console.log("Message provenant du serveur : ", data);
});

function envoyer() {
    socket.emit("fromMobile", { action: "click", time: Date.now() });
}