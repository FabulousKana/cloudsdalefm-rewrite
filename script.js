/* 
 *  CloudsdaleFM website is licensed under the Mozilla Public License 2.0
 *  that should be attached to this project, if not, you can read MPL2.0 here:
 *  https://www.mozilla.org/en-US/MPL
 */



justRunIt = 1; /* Boolean, type false or 0 if you want to use functions for something else. */

function detectUnsupportedBrowser()
{
    if (navigator.userAgent.indexOf("Trident") >= 0)
    {
        console.log(navigator.userAgent);
        console.log(document.getElementById("OBWarning").style.display = "block");
        return 1;
        /*
         *  Because Internet Explorer uses very obsolete technology
         *  and Microsoft Edge is now official MS browser we decided
         *  to NOT support IE, sorry.
         */
    }
    return 0;
}

function runPlayer()
{
    /*
     *  DIV with ID "player" MUST exist.
     */
    new CloudsdalePlayer("player", {
        webTitle: 0,
        contextMenu: 0,
        background: 0
    });
    return 0;
}

let result = "";
blinkSpan = "<span>|</span>";
texts = new Array(
    /* CloudsdaleFM/brony-related */
    "Głos polskiego fandomu",
    "Z nami polski fandom nie umrze 🇵🇱",
    "Jedyne prawdziwe kucykowe radio w Polsce - w pełni non-profit.",
    "Teraz w jeszcze lepszej odsłonie",
    "Usłysz muzykę z serca fandomu.",
    "Razem zmieniamy fandom, na lepsze.",
    "Ta, asystentem. A więc tak to się teraz nazywa.",
    /* MLP-related */
    "Louder! LOUDER! LOOOUUDEEEER!!",
    "My Little Pony, My Little Pony, aaAaAAAA...",
    "I'M SOOO EXCITEED!",
    "Niech żyje Equestria!",
    "Tylko nie wykręcaj mi się tu matematyką!",
    "Kochana Twilight Sparkle, moja wierna uczennico..",
    "Now 20% cooler!",
    "Macie mnie pokochać!",
    "You Pinkie Promised!",
    "Chwytaj za pióro; do Księżniczki!",
    /* Other */
    "for (song in dir('coolmusak/')) {play(song); }"
);
var insideText = texts[Math.floor(Math.random()*texts.length)];
    
function nextStep(index = 0)
{
    result += insideText.charAt(index);
    document.getElementById("typingMachine").innerHTML = result + blinkSpan;
    if(result.length < insideText.length)
    {
    	setTimeout(() => nextStep(++index), 50);
    }
}

/* -- -- -- -- -- -- -- -- -- -- -- -- */

if (justRunIt)
{
    var browserstatus = detectUnsupportedBrowser();
    if (!browserstatus)
    {
        runPlayer();
        nextStep();
        document.getElementById("logo").onclick = function(){ window.location = "https://www.cloudsdalefm.net/"; };
    }
}
