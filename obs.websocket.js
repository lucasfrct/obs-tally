var intervalID = 0;
var intervalID = 0;
var sceneRefreshInterval = 0;
var socketisOpen = false;
var studioMode = false;

var currentState = {
    "watchedSource": "",  // the source we are watching if any
    "watchedScene_s": [],   // the selected scene(s) we are monitoring
    "previewScene": "",   // the name of the current preview scene
    "programScenes": [],  // the name of the current live scenes. (can be 2 during transitions.)
    "streaming": false,   // are we currently streaming?
    "sceneList": [],		  // a place to store the obs scene list
    "watchingStreamStatus": false	//if the stream status is watched
}


function connectWebsocket(serverip = "127.0.0.1:4444") {
    websocket = new WebSocket("ws://" + serverip);

    websocket.onopen = function (evt) {
        socketisOpen = 1;
        clearInterval(intervalID);
        intervalID = 0;
        requestInitialState();
    };

    websocket.onclose = function (evt) {
        socketisOpen = 0;
        if (!intervalID) {
            intervalID = setInterval(connectWebsocket, 5000);
        }
    };

    websocket.onmessage = function (evt) {
        var data = JSON.parse(evt.data);
        // console.log('onmessage', data);

        if (data.hasOwnProperty("message-id")) {
            handleInitialStateEvent(data)
        } else if (data.hasOwnProperty("update-type")) {
            handleStateChangeEvent(data)
        } else {
            console.log('onmessage unable to handle message.', data);
        }
    };

    websocket.onerror = function (evt) {
        socketisOpen = 0;
        if (!intervalID) {
            intervalID = setInterval(connectWebsocket, 5000);
        }
    };
}

function enterFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    }
}
console.log("OBS WEBSOKET", currentState)