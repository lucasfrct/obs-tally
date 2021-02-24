var ElementNav = null
var ElementTally = null
var ElementScenes = null

function OBSInterface() {

    ElementNav = document.querySelector(".navigation")
    ElementTally = document.querySelector(".tally")
    ElementScenes = document.querySelector(".scenes")

    startTime((clock)=> { ElementNav.querySelector(".clock").innerHTML = clock })

    obsSocket.connect()
    obsSocket.subscribe(InitialInterface)
    obsSocket.heartbeat((socket)=> { Navigation(socket.resume) })
    
}

function InitialInterface(socket) {
    console.log("LOAD DISPLAY", socket)
        
        Navigation(socket.resume)
        ScenesList(socket.sceneList)
        Tally(obsSocket.tally)
    
        //console.log("INTERFACE", ElementTally.children[0])
        //console.log("Soket", obsSocket)
}

function Navigation(resume) {
    let profile = ElementNav.querySelector(".profile")
    let cpu = ElementNav.querySelector(".cpu")
    let fps = ElementNav.querySelector(".fps")

    profile.innerHTML = resume.profile
    cpu.innerHTML = String(resume.cpu).substring(0,3)+"%"
    fps.innerHTML = String(resume.fps).substring(0,2)
}

function Tally(tally = null) {
    
    if(tally.prev) {
        LedPVW(ElementTally.children[0])
    } 
    
    if(tally.pgm) {
        LedPGM(ElementTally.children[0])
    } 
    
    if(tally.on){
        LedOFF(ElementTally.children[0])
    }

    if(tally.name) { ElementTally.children[0].children[0].innerHTML = tally.name }
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
    scenes.forEach((scene)=> {
        let el = SceneTemplate(scene)
        ElementScenes.children[0].appendChild(el)
    })
}

function SceneTemplate(scene = null) {
    let element = document.createElement("div")
    element.classList.add("scene")
    element.classList.add("pgm")
    element.innerHTML = scene.name

    element.onclick = function(event) {
        event.defaultPrevented = true
        element.classList.toggle("active")
        obsSocket.addTally(scene)
    }

    return element
}