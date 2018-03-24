
let render = null
let header = null
let page = 0
let songsPerPage = 20
let pages = 0

const counter = document.createElement("div")
const previous = document.createElement("div")
previous.className = "songPagesPrev"
const next = document.createElement("div")
next.className  = "songPagesNext"

const promptVisibleClass = "visible"
const promptHiddenClass = "hidden"

const promptBG = document.createElement("div")
promptBG.className = `songPromptBG ${promptHiddenClass}`
const prompt = document.createElement("div")
prompt.className = `songPrompt ${promptHiddenClass}`
promptBG.appendChild(prompt)

const buttonClass = "songPagesRequest"

const cache = {}

function fetchPage(page) {
    if(cache[`p${page}`]) return Promise.resolve(cache[`p${page}`])
    return fetch(`https://www.cloudsdalefm.net/api/data/songs?page=${page-1}&size=${songsPerPage}`) // change to /api/data/songs
        .then(res => res.json())
        .then(data => {
            cache[`p${page}`] = data
            return data
        })
}

function addTD(content) {
    const td = document.createElement("td")
    if(typeof content === "string" || typeof content === "number") {
        td.appendChild(document.createTextNode(content))
    } else if (content instanceof Node){
        td.appendChild(content)
    } else {
        console.log("AAA")
        return false
    }
    return td
}

function trackToHTML(index, page, track, onPress) {
    track = track.split("-")
    const button = document.createElement("div")
    button.className = buttonClass
    button.addEventListener("mousedown", () => onPress(track))
    const wrap = document.createElement("tr")
    wrap.appendChild(addTD((page-1)*songsPerPage + index+1)) // id
    wrap.appendChild(addTD(track.splice(0,1)[0].trim())) // artist
    wrap.appendChild(addTD(track.join("-").trim())) // title
    wrap.appendChild(button)
    return wrap
}

let timeout = false
function promptState(show = true, content = "") {
    if(show && prompt.className.includes(promptHiddenClass)) {
        prompt.innerHTML = content
        promptBG.className = `songPromptBG ${promptVisibleClass}`
        prompt.className = `songPrompt ${promptVisibleClass}`
        if(!timeout) {
            timeout = true
            console.log("setting timeout")
            setTimeout(() => { 
                timeout = false;
                promptState(false) 
            }, 15000)
        }
    } else if(prompt.className.includes(promptVisibleClass)) {
        promptBG.className = `songPromptBG ${promptHiddenClass}`
        prompt.className = `songPromptBG ${promptHiddenClass}`
    }
}

let requesting = false
function requestSong(title) {
    if(requesting) return;
    requesting = true
    true || fetch("https://www.cloudsdalefm.net/api/requestsong", { // change to /api/requestsong
        method: "POST",
        cache: "no-store",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            title
        })
    }).then(res => res.json())
    Promise.resolve({"code":200,"status":"Found and Requested","data":"Glaze - Building Worlds (GatoPaint Cover)"})
    .then(res => {
        if(res.code === 200)
            promptState(true, `Piosenka <b>${res.data}</b> zamówiona!`)
        else if(res.code === 429)
            promptState(true, `Ta piosenka ${res.tryagain ? "była ostatnio zamówiona, poczekaj chwile" : "właśnie leci w radiu!"}`)
        requesting = false
    })
}

function reDraw(page, render) {
    fetchPage(page).then(res => {
        for(let i=0;i<res.data.length;i++) {
            const song = res.data[i]
            const newTr = trackToHTML(i, page, song, requestSong)
            if(render.children[i])
                render.replaceChild(newTr, render.children[i]) // replace song in list
            else
                render.appendChild(newTr) // if it was last page with less songs, add new one
        }
        if(res.data.length < render.children.length) {
            while(render.children.length - res.data.length > 0) { // if last page have less songs than fetched, remove to math
                render.removeChild(render.lastChild)
            }
        }
    })
}

function updateCouter() {
    counter.innerText = `Strona ${page} z ${pages}`
}

previous.addEventListener("mousedown", () => 
    window.location.hash = `page=${page === 1 ? 1 : page - 1}`
)

next.addEventListener("mousedown", () =>
    window.location.hash = `page=${page === pages ? pages : page + 1}`
)

window.addEventListener("DOMContentLoaded", () => {
    header = document.getElementById("searchHeader")
    header.appendChild(promptBG)
    header.appendChild(previous)
    header.appendChild(counter)
    header.appendChild(next)
    render = document.getElementById("songSearchResults").getElementsByTagName("tbody")[0]
    page = parseInt(window.location.hash.replace("#page=", ""))
    if(isNaN(page) || page < 0) {
        page = 1    
        window.location.hash = "page=1"
    }
    
    fetchPage(page).then(res => {
        pages = res.pages+1
        updateCouter()
        for(let i=0;i<res.data.length;i++) {
            const song = res.data[i]
            render.appendChild(trackToHTML(i, page, song, requestSong))
        }
    })
})

window.addEventListener("hashchange", () => {
    let newPage = parseInt(window.location.hash.replace("#page=", ""))
    if(isNaN(newPage) || newPage < 0 || newPage === page || !(render instanceof Node)) return;
    page = newPage
    updateCouter()
    reDraw(page, render)
})