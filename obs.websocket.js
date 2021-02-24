var obsSocket = {
    on: 0,
    open: 0,
    ip: "127.0.0.1:4444",
    instance: null,
    resume: { profile: "OBS TALLY", streaming: false, fps: 0, cpu: 0, mode: "studio", time: "0" },
    monitor: { preview: "prev", program: "pgm" },
    sceneList: [],
    tally: { scenes: [ ], prev: false, pgm: false },
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
    console.log("OBS NOTIFY: ", obsSocket)
    obsSocket.observers.forEach((fn, index)=> {
        if(fn) { fn(obsSocket) } 
    })
}

function heartbeat(fn = null) {
    obsSocket.beats.push(fn)
}

function OBSHeartNotify() {
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
            obsSocket.resume.time = data['stream-timecode']
            break
        case "get-preview-scene":
            obsSocket.monitor.preview = data['name']
            break
        case "get-scene-list":
            obsSocket.monitor.program = data['current-scene']
            obsSocket.sceneList = data.scenes.map(buildScene)
            break
        default:
            break
    }
        
    obsSocket.notify()
}

function buildScene(scene) {
    let sceneFormat = { name: scene.name, prev: false, pgm: false }
    if(scene.name == obsSocket.monitor.preview) { sceneFormat.prev = true }
    if(scene.name == obsSocket.monitor.program) { sceneFormat.pgm = true }
    return sceneFormat
}

function OBSHandleStateChangeEvent(data) {

    const updateType = data["update-type"]
    let displayNeedsUpdate = true

    switch (updateType) {
        case "PreviewSceneChanged":
            obsSocket.monitor.preview = data["scene-name"]
            break
        case "SwitchScenes":
            obsSocket.monitor.program = data["scene-name"]
            break
        case "StreamStarted":
            obsSocket.resume.streaming = true
            break
        case "StreamStopping":
            obsSocket.resume.streaming = false
            break
        case "TransitionBegin":
            obsSocket.monitor = { preview: data["from-scene"], program: data["to-scene"]}
            break
        default:
            displayNeedsUpdate = false
            obsSocket.monitor.program = data['current-scene']
            obsSocket.resume.streaming = data['streaming']
            
            if(obsSocket.resume.cpu = data.stats) {
                obsSocket.resume.cpu = data.stats['cpu-usage']
                obsSocket.resume.fps = data.stats['fps']
            }

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