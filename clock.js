function startTime(fn = null) {
    let today = new Date()
    let h = today.getHours()
    let m = today.getMinutes()
    let s = today.getSeconds()
    m = checkTime(m)
    s = checkTime(s)
    let clock = String(h + ":" + m + ":" + s)
    if(fn) { fn(clock) }
    setTimeout(()=> { startTime(fn) }, 500)
    return clock
}

function checkTime(i) {
    if (i < 10) { i = "0" + i }
    return i;
}