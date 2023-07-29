const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;  //default port 8080

const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

app.post("/login", (req, res) => {
    const { username } = req.body;
    res.cookie("username", username);
    res.redirect("/urls");
  });

app.post('/urls/:id', (req, res) => {
    const urlId = req.params.id;
    urlDatabase[urlId] = req.body.longURL;
    res.redirect('/urls');
  });

app.post("/urls/:id/delete", (req, res) => {
    const urlId = req.params.id;
    delete urlDatabase[urlId];
    res.redirect("/urls");
})

app.post("/urls", (req, res) => {
    console.log(req.body); 
    res.send("Ok"); 
  });

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.send("Hello!");
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

app.get("/urls", (req, res) => {
    const templateVars = { urls: urlDatabase };
    res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
    res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[shortURL] = longURL;
    res.redirect(`/urls/${shortURL}`);
  });

  app.get("/u/:id", (req, res) => {
    const longURL = urlDatabase[req.params.id];
    res.redirect(longURL);
  });

function generateRandomString() {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    for (let i = 0; i < 6; i++) {

        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
