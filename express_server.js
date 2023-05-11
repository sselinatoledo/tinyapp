function generateRandomString() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs")

// 4. Adding the middleware to parse the request body and make it readble.
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};



// S1 - Route root that returns a simple "Hello!".
app.get("/", (req, res) => {
  res.send("Hello!");
});

// S2 - Route that returns jason representation of the database.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// S3 - Route that returns "Hello World" in bold.
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// 1. SENDING DATA TO urls_index.ejs.
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

// 3. CREATING NEW URL.
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// 2. ADDING A SECOND ROUTE AND TEMPLATE.
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// 5. RESPOND TO THE FORM SUBMISSION WITH A CONFIRMATION MESSAGE. ADD NEW KEY-VALUE PAIR WHERE shortURL is key and longURL is value.
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// S4 - Route to redirect short URLs to their long URLS
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// 7. REMOVES A URL resource.
app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

// 8. when you edit it and submit the new url 
app.post('/urls/:id', (req, res) => {
  const { id } = req.params;
  const newLongURL = req.body.longURL;
  urlDatabase[id] = newLongURL;
  res.redirect('/urls');
});

// 9. Add log in 
app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username)
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});