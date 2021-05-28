const fs = require('fs')
const express = require('express')
const app = express()
var cookieParser = require('cookie-parser')
app.use(cookieParser())

/*

         GENERAL CODE MUST BE EXECUTED IN main() OR AT
         LINE 68

*/

function wait(a) { return new Promise(resolve => { setTimeout(() => { resolve(); }, a * 1000); }) }
var validLogins = {}
async function loginRefresher() {
    while (true) {
        let content = fs.readFileSync("./validLogins.json", "utf8")
        try {
            content = JSON.parse(content)
        } catch (error) {
            console.error(error);
            process.exit()
        }
        validLogins = content
        await wait(2)
    }
}
function validateLogin(Username, Password, RawFormat) {
    if (RawFormat) {
        let Splits = RawFormat.split("/")
        Username = Splits[0]; Password = Splits[1]
    }
    var validation = false
    if (Username in validLogins) {
        validation = validLogins[Username] === Password
    }
    return validation
}

nodes = {
    "/": {
        path: "./Site/Login.html",
        requireAuthenication: true,
        authenicatedpath: "./Site/NotFound.html",
        callback: undefined
    }
}
APInodes = {
    "/login": function(other) {
        let parameters = other.url.split("/")
        let username = parameters[3].split("=")[1]
        let password = parameters[4].split("=")[1]
        var login = validateLogin(username, password)
        if (login == true) other.res.cookie('unpw', username + "/" + password, { maxAge: 600000, httpOnly: true });
        other.res.setHeader('Content-Type', 'application/json');
        other.res.send({ success: login })
    }
}

publicImages = [

]
publicSpaces = [
    "/nicepage.css", "/Login.css", "/jquery.js", "/nicepage.js","/favicon.ico"
]

function main() {
    loginRefresher()
}

app.get('*', (req, res) => {
    this.req = req
    this.res = res
    this.url = req.url
    this.host = req.get('host')
    this.cookies = req.cookies

    if (publicSpaces.includes(this.url)) {
        res.sendFile("./Site"+this.url, { root: __dirname });
    } else if (this.url.startsWith("/api")) {
        let APICall = this.url.split("/")[2]
        if ("/"+APICall in APInodes) {
            APInodes["/"+APICall](this)
        } else {
            res.send("404 Not found")
        }
    } else if (this.url in nodes) {
        this.node = nodes[this.url]
        if (this.node["callback"]) this.node["callback"](this)

        if (this.node["requireAuthenication"] == true) {
            let authenicator = this.cookies["unpw"]
            if (authenicator) {
                let validated = validateLogin("","",authenicator)
                if (validated) this.res.sendFile(this.node["authenicatedpath"], { root: __dirname });
            }
        }
        res.sendFile(this.node["path"], { root: __dirname });
    } else {
        res.sendFile("./Site/NotFound.html", { root: __dirname });
    }
})

main()

app.use(express.static('public'))

app.listen(3028, "0.0.0.0", () => console.log("http://localhost:3028"))