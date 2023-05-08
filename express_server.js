const generateRandomString = function(length, characters) {
  let result = "";
  const charactersLength = characters.length;
  for (let i in length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
  });

app.get("/urls/:id", (req, res) => {
    const id = req.params.id;
    const longURL = urlDatabase[id];
    const templateVars = { id, longURL }
    res.render("urls_show", templateVars);
  });

app.get("/urls", (req, res) => {
    const templateVars = { urls: urlDatabase };
    res.render("urls_index", templateVars);
  });

app.get("/", (req, res) => {
    res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
    console.log(req.body); // Log the POST request body to the console
    res.send("Ok"); // Respond with 'Ok' (we will replace this)
  });

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});