const createElement = (type, opts, ...children) => {
    const el = document.createElement(type)
    if(opts) {
        for(const [key, val] of Object.entries(opts)) 
            el[key] = val
    }
    if(children.length > 0) 
        for(const child of children)
            if(child instanceof Node)
                el.appendChild(child)
            else
                el.appendChild(document.createTextNode(child))
    return el
}

const r = arr => arr[Math.floor(Math.random()*arr.length)]
const rand = r([
    "Page not found",
    "This page is lost for ever",
    "THIS WORLD DOESNT EXIST ON MY CHRISTIAN MINECRAFT SERVER",
    "Are you lost?",
    "Do you need help?",
    "Nope, wrong page",
    "Try again",
    "Oh boy you're so lost"
])

let time = 3 
const timeSpan = createElement("span", null, time)
setInterval(() => {
    time--
    if(time > 0)
        return timeSpan.innerText = time
    timeSpan.innerText = "Bye!"
    render.className = "container moving"
    setTimeout(() => window.location.href =  "/", 250)
}, 1000)


const render = createElement(
    "div", 
    { className: "container" },
    createElement("img", { src: "/404/icon.png", width:"200" }),
    createElement("h1", null, 404),
    createElement("p", null, rand),
    createElement("div", { className: "timer" }, "Przekierowanie za...", timeSpan)
)

render.addEventListener("mousedown", () => {
    window.location.href =  "/"
})

document.addEventListener("DOMContentLoaded", () => {
    const wrap = document.getElementsByClassName("wrapper")[0]
    wrap.appendChild(render)
})
