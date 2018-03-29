
let render = null
let header = null
let page = 0
let songsPerPage = 20
let pages = 0

const counter = document.createElement("div")
counter.className = "pageName";
const previous = document.createElement("div")
previous.className = "songPagesPrev"
const next = document.createElement("div")
next.className = "songPagesNext"
previous.innerText = "<"
next.innerText = ">"

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
    return fetch(`/api/data/songs?page=${page}&size=${songsPerPage}`)
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
        console.error("AAA")
        return false
    }
    return td
}

function trackToHTML(index, page, track, onPress) {
    let song = track.split("-")
    const button = document.createElement("div")
    button.className = buttonClass
    button.innerText = "+"
    button.addEventListener("mousedown", onPress(track))
    const wrap = document.createElement("tr")
    wrap.appendChild(addTD((page-1)*songsPerPage + index+1)) // id
    wrap.appendChild(addTD(song.splice(0,1)[0].trim())) // artist
    wrap.appendChild(addTD(song.join("-").trim())) // title
    wrap.appendChild(button)
    return wrap
}

let timeout = false
function promptState(show = true, content = "") {
    if(show) {
        prompt.innerHTML = content
        promptBG.className = `songPromptBG ${promptVisibleClass}`
        prompt.className = `songPrompt ${promptVisibleClass}`
        if(timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(() => { 
            timeout = false;
            promptState(false) 
        }, 15000)
    } else if(prompt.className.includes(promptVisibleClass)) {
        promptBG.className = `songPromptBG ${promptHiddenClass}`
        prompt.className = `songPromptBG ${promptHiddenClass}`
    }
}

let requesting = false
function requestSong(title) {
    return function(evn) {
        evn.preventDefault()
        if(requesting) return;
        requesting = true
        fetch("/api/requestsong", {
            method: "POST",
            cache: "no-store",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                title
            })
        }).then(res => res.json())
        .then(res => {
            if(res.code === 200)
                promptState(true, `Piosenka <b>${res.data}</b> zamówiona!`)
            else if(res.code === 429)
                promptState(true, `Ta piosenka ${res.tryagain ? "była ostatnio zamówiona, poczekaj chwile" : "właśnie leci w radiu!"}`)
            else if(res.code === 413)
                promptState(true, `Kolejka jest pełna.`)
            else 
                promptState(true, "Oj, wystąpił nieznany błąd! Spróbuj ponownie za chwile.")
            requesting = false
        })
    }
}

function reDraw(data) {
    for(let i=0;i<data.length;i++) {
        const song = data[i]
        const newTr = trackToHTML(i, page, song, requestSong)
        if(render.children[i])
            render.replaceChild(newTr, render.children[i]) // replace song in list
        else
            render.appendChild(newTr) // if it was last page with less songs, add new one
    }
    if(data.length < render.children.length) {
        while(render.children.length - data.length > 0) { // if last page have less songs than fetched, remove to math
            render.removeChild(render.lastChild)
        }
    }
}

function changePage(page, render) {
    fetchPage(page).then(res => {
        reDraw(res.data)
    })
}

function showSearch(query) {
    fetch(`/api/data/searchsong?length=20&title=${query}`)
    .then(res => res.json())
    .then(res => {
        if(res.exists)
            reDraw(res.titles)
        else
            promptState(true, "Nic nie znaleziono.")
    })
}

function updateCouter() {
    counter.innerText = `Strona ${page} z ${pages}`
}

previous.addEventListener("mousedown", () => 
    window.location.hash = `page/${page <= 1 ? 1 : page - 1}`
)

next.addEventListener("mousedown", () =>
    window.location.hash = `page/${page >= pages ? pages : page + 1}`
)

window.addEventListener("DOMContentLoaded", () => {
    header = document.getElementById("searchHeader")
    header.appendChild(promptBG)
    header.appendChild(previous)
    header.appendChild(counter)
    header.appendChild(next)
    render = document.getElementById("songSearchResults").getElementsByTagName("tbody")[0]

    const search = header.getElementsByTagName("input")[0]
    const searchEvn = () => {
        if(search.value.length > 0)
            window.location.hash = `search/${search.value}`
        else if(window.location.hash.startsWith("#search/"))
            window.location.hash = `page/${page}`
    }
    
    search.addEventListener("keydown", evn => {
        if(evn.keyCode === 13) {
            searchEvn()
        }
    })
    search.addEventListener("blur", searchEvn)
    page = parseInt(window.location.hash.replace("#page/", ""))
    if(isNaN(page) || page < 0) {
        page = 1    
        window.location.hash = "page/1"
    }
    
    fetchPage(page).then(res => {
        pages = res.pages
        updateCouter()
        for(let i=0;i<res.data.length;i++) {
            const song = res.data[i]
            render.appendChild(trackToHTML(i, page, song, requestSong))
        }
    })
})

window.addEventListener("hashchange", () => {
    if(window.location.hash.startsWith("#page/")) {
        const newPage = parseInt(window.location.hash.replace("#page/", ""))
        if(isNaN(newPage) || newPage < 0 || !(render instanceof Node)) return;
        page = newPage
        updateCouter()
        changePage(page, render)
    } else if(window.location.hash.startsWith("#search/")) {
        const query = window.location.hash.replace("#search/", "")
        showSearch(query)
    }
})