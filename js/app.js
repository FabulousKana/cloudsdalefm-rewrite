// Coded by BlackBird for CloudsdaleFM.net 

(function() {
const loadCallbacks = []
const contentCallbacks = []

// Service worker
if ('serviceWorker' in navigator || false) {
    contentCallbacks.push(
        () => {
        var swUrl = "/service-worker.js"
        navigator.serviceWorker
            .register(swUrl, { scope: "/" })
            .then(registration => {
                registration.update();
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                const msg = document.createElement("div")
                                msg.className = "cacheMessage"
                                msg.innerHTML = "Nowa zawartość strony jest dostępna! Ale cache nie pozwala ci jej zobaczyć. Naciśnij <b>ctrl+f5</b> po najnowszą strone!"
                                document.body.appendChild(msg)
                                console.log('New content available! Press ctrl+f5!')
                            } else {
                                console.log('Content is alerady cached for offline use.');
                            }
                        }
                    };
                };
                console.log('[ServiceWorker]', 'Registered');
            })
            .catch(error => {
                console.warn('[ServiceWorker]', 'Error during service worker registration:', error);
            });
        }
    )
}

const loadSchedule = () => {
    const DOM = document.getElementById("schedule")
    if(!DOM) return;
    const days = DOM.getElementsByTagName("tr")
    fetch("/data/scheluder.json", { cache: "no-store" })
        .then(res => res.json())
        .then(data => {
            const val = Object.values(data)
            for(let i=0;i<days.length;i++) {
                let text = ""
                const schedule = Object.keys(val[i]) 
                if(schedule.length > 0)
                    for(const key of schedule)
                        text += `${key} - ${val[i][key]}`
                days[i].children[1].innerHTML = text.length < 1 ? "Dzień wolny" : text
            }
        })
        .catch(err => console.error(err))
}


const createPartner = (name, web, img) => {
    const link = document.createElement("a")
    link.href = web
    const image = document.createElement("img")
    image.src = img
    image.alt = name
    link.appendChild(image)
    return link
}
const loadPartners = () => {
    const DOM = document.getElementById("partners")
    if(!DOM) return;
    fetch("/data/partners.json", { cache: "no-store" })
        .then(res => res.json())
        .then(data => {
            for(const partner of Object.keys(data)) {
                const info = data[partner]
                const node = createPartner(partner, info.webpage, info.image || `/images/banners/${partner}.png`)
                DOM.appendChild(node)
            }
        })
        .catch(err => console.error(err))
}

contentCallbacks.push(loadSchedule)
contentCallbacks.push(loadPartners)

window.addEventListener("DOMContentLoaded", evn => {
    for (const cb of contentCallbacks) cb(evn)
})

window.addEventListener("load", evn => {
    for (const cb of loadCallbacks) cb(evn)
})

})()