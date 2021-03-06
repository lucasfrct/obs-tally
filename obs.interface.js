var ElementNav = null
var ElementTally = null
var ElementScenes = null

function OBSInterface() {

    console.log("LOAD TALLY", obsSocket)

    ElementNav = document.querySelector(".navigation")
    ElementTally = document.querySelector(".tally")
    ElementScenes = document.querySelector(".scenes")

    startTime((clock)=> { ElementNav.querySelector(".clock").innerHTML = clock })

    obsSocket.connect()
    obsSocket.subscribe(InitialInterface)
    obsSocket.heartbeat((socket)=> { Navigation(socket.resume) })
    
}

function InitialInterface(socket) {
    //console.log("LOAD DISPLAY", socket)
    Navigation(obsSocket.resume)
    TallySingle(obsSocket.monitor)
    ScenesList(obsSocket.sceneList)
}

function Navigation(resume) {
    ElementNav.querySelector(".time").innerHTML = String(resume.time).substring(0,8)
    ElementNav.querySelector(".profile").innerHTML = resume.profile
    ElementNav.querySelector(".cpu").innerHTML = String(resume.cpu).substring(0,3)+"%"
    ElementNav.querySelector(".fps").innerHTML = String(resume.fps).substring(0,4)
}

function TallySingle(monitor = null) {
    ElementTally.querySelector(".preview").innerHTML = monitor.prev
    ElementTally.querySelector(".program").innerHTML = monitor.pgm
}

function LedPGM(led = null) {
    led.classList.add('pgm')
    led.classList.remove('pvw')
}

function LedPVW(led = null) {
    led.classList.add('pvw')
    led.classList.remove('pgm')
}

function LedOFF(led = null) {
    led.classList.remove('pvw')
    led.classList.remove('pgm')
}

function ScenesList(scenes = []) {
    //console.log("////////////////////////////////////////////////", scenes)
    ElementScenes.children[0].innerHTML = ""
    
    scenes.forEach((scene)=> {
        let el = SceneTemplate(scene)
        ElementScenes.children[0].appendChild(el)
    })
}

function SceneTemplate(scene = null) {
    let element = document.createElement("div")
    element.classList.add("scene")
    
    if(scene.prev) { element.classList.add("prev") }
    if(scene.pgm) { element.classList.add("pgm") }
    element.innerHTML = scene.name

    element.onclick = function(event) {
        event.defaultPrevented = true
        element.classList.toggle("active")
        obsSocket.addTally(scene)
    }

    return element
}