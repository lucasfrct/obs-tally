var obsSocket = {
    on: 0,
    open: 0,
    ip: "127.0.0.1:4444",
    instance: null,
    resume: { profile: "OBS TALLY", streaming: false, fps: 0, cpu: 0, mode: "single", time: "0" },
    monitor: { prev: "PREV", pgm: "PGM" },
    sceneList: [],
    tally: { name: "TALLY", scenes: [ ], prev: false, pgm: false },
    tallys: [],
    beats: [],
    heartbeat: heartbeat,
    heartNotify: OBSHeartNotify,
    observers: [],
    subscribe: OBSSubscribe,
    notify: OBSNotify,
    connect: OBSWebSocket,
    addTally: OBSBuildTally,
}

function OBSSubscribe(fn = null) {
    obsSocket.observers.push(fn)
}

function OBSNotify() {
    //console.log("OBS NOTIFY: ", obsSocket)
    obsSocket.observers.forEach((fn, index)=> {
        if(fn) { fn(obsSocket) } 
    })
}

function heartbeat(fn = null) {
    obsSocket.beats.push(fn)
}

function OBSHeartNotify() {
    //console.log("BEAT NOTIFY: ", obsSocket)
    obsSocket.beats.forEach((fn)=> {
        if(fn) { fn(obsSocket) } 
    })
}

function OBSWebSocket() {
    obsSocket.instance = new WebSocket("ws://" + obsSocket.ip)
    
    obsSocket.instance.onopen = function (evt) {
        obsSocket.open = 1
        clearInterval(obsSocket.on)
        obsSocket.on = 0
        OBSInitialState()
    }

    obsSocket.instance.onclose = function (evt) {
        obsSocket.open = 0
        if (!obsSocket.on) {
            obsSocket.on = setInterval(connectWebsocket, 3000)
        }
    }

    obsSocket.instance.onmessage = function (evt) {
        let data = JSON.parse(evt.data)
        
        console.log("UPDATE ON MESSAGE: ", data)

        if (data.hasOwnProperty("message-id")) {
            OBSHandleInitialStateEvent(data)
        } else if (data.hasOwnProperty("update-type")) {
            OBSHandleStateChangeEvent(data)
        }

    }

    obsSocket.instance.onerror = function (evt) {
        obsSocket.open = 0
        if (!obsSocket.on) {
            iobsSocket.on = setInterval(connectWebsocket, 3000)
        }
    }

}

function OBSInitialState() {

    const commands = [
        {
            "message-id": "get-scene-list",
            "request-type": "GetSceneList"
        },
        {
            "message-id": "get-studio-mode-status",
            "request-type": "GetStudioModeStatus"
        },
        {
            "message-id": "get-preview-scene",
            "request-type": "GetPreviewScene"
        },
        {
            "message-id": "get-streaming-status",
            "request-type": "GetStreamingStatus"
        },
    ]

    for (let i = 0; i < commands.length; i++) {
        if (obsSocket.open) { obsSocket.instance.send(JSON.stringify(commands[i])) }
    }
}

function OBSHandleInitialStateEvent(data) {
    
    const messageId = data["message-id"]

    switch (messageId) {
        case "get-studio-mode-status":
            obsSocket.resume.mode = (data["studio-mode"]) ? "studio" : "single"
            break
        case "get-streaming-status":
            obsSocket.resume.streaming = data['streaming']
            if(data['streaming']) { obsSocket.resume.time = data['stream-timecode'] }
            break
        case "get-preview-scene":
            obsSocket.monitor.prev = data['name']
            break
        case "get-scene-list":
            obsSocket.monitor.pgm = data['current-scene']
            obsSocket.sceneList = buildScene(data['scenes'])
            break
        default:
            break
    }
        
    obsSocket.notify()

}

function buildScene(scenes) {
    let ScenesList = []
    scenes.forEach((scene)=> {
        let pr = false
        let pg = false
        if(scene.name == obsSocket.monitor.prev) { pr = true }
        if(scene.name == obsSocket.monitor.pgm) { pg = true }
        ScenesList.push({ name: scene.name, prev: pr, pgm: pg })
    })
    return ScenesList
}

function OBSHandleStateChangeEvent(data) {
   
    console.log("UPDATE OBS", data)
    
    const updateType = data["update-type"]
    let displayNeedsUpdate = true
    

    switch (updateType) {
        case "PreviewSceneChanged":
            obsSocket.monitor.prev = data["scene-name"]
            OBSUpdateSceneList()
            break
        case "SwitchScenes":
            obsSocket.monitor.pgm = data["scene-name"]
            break
        case "StreamStarted":
            obsSocket.resume.streaming = true
            break
        case "StreamStopping":
            obsSocket.resume.streaming = false
            break
        case "TransitionBegin":
            obsSocket.monitor = { prev: data["from-scene"], pgm: data["to-scene"]}
            break
        case "StreamStatus":
            obsSocket.resume.cpu = data['cpu-usage']
            obsSocket.resume.fps = data['fps']
            obsSocket.resume.time = data['stream-timecode']
            break
        default:
            displayNeedsUpdate = false
            break
    }

    obsSocket.heartNotify()
    
    if (displayNeedsUpdate) {
        obsSocket.notify()
    }
}

function OBSBuildTally(scene) {
    obsSocket.tally.name = (!obsSocket.tally.name) ? scene.name : obsSocket.tally.name
    obsSocket.tally.scenes.push(scene)
    obsSocket.notify()
}

function OBSUpdateSceneList() {
    buildScene(obsSocket.sceneList)
    console.log("===============>>>>>>>>>>>>>",obsSocket.sceneList)
}