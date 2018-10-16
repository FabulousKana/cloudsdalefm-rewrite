// Coded by BlackBird for CloudsdaleFM.net 

(function({ h, render }) {
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
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    render(document.body,
                                        h('div', { class: "cacheMessage" }, [
                                            "Nowa zawartość strony jest dostępna! Ale cache nie pozwala ci jej zobaczyć. Naciśnij ",
                                            h('b', null, "ctrl+f5"),
                                            " po najnowszą strone!"
                                        ])
                                    )
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
    
    function createSchedulerEntry(time, author, title) {
        return h('div', { class: "s-content" }, [
                h('div', { class: "hour" }, time),
                h('div', { class: "data" }, [
                    h('div', { class: "title" }, title),
                    h('div', { class: "author" }, [ 
                        "prowadzi ",
                        h('span', null, author)
                    ])
                ])
            ])
    }
    
    const loadSchedule = () => {
        const DOM = document.getElementById("schedule")
        if(!DOM) return;
        const days = DOM.querySelectorAll("div.day")
        fetch("api/data/scheluder", { cache: "no-store" })
            .then(res => res.json())
            .then(({ scheluder }) => {
                const val = Object.values(scheluder)
                for(let i=0;i<days.length;i++) {
                    let entries = Object.entries(val[i])
                    for(const [hour, text] of entries) {
                        let parts = text.split(" - ")
                        render(days[i],
                            createSchedulerEntry(hour, parts.splice(0, 1), parts.join(" - "))
                        )
                    }
                    if(entries.length < 1) {
                        render(days[i],
                            h('div', { class: 's-content', 'data-empty': true }, "Dzień Wolny!")
                        )
                    }
                }
            })
            .catch(err => console.error(err))
    }
    
    
    const createPartner = (name, web, img) => {
        return h('a', { href: web },
                h('img', { src: img, alt: name })
            )
    }
    
    const loadPartners = () => {
        const node = document.getElementById("partners")
        if(!node) return;
        fetch("api/data/partners", { cache: "no-store" })
            .then(res => res.json())
            .then(({ partners }) => {
                for(const partner of Object.keys(partners)) {
                    const info = partners[partner]
                    const vTree = createPartner(partner, info.webpage, info.image || `/images/banners/${partner}.png`)
                    render(node, vTree)
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
    
})(vDOM)
    