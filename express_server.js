const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { getUserByEmail } = require("./helpers");
const app = express();
app.set("view engine", "ejs");


app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['secret-key']
}));

const PORT = 8080;

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "a1htf",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const database = {
  a1: {
    id: "a1",
    email: "a@a.com",
    password: bcrypt.hashSync("1234", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "b@b.com",
    password: "1234",
  },
};


app.get('/error', (req, res) => {
  const message = 'Oops! Something went wrong.';
  res.status(500).render('error', { message });
});

app.get('/register', (req, res) => {

  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('register', { user: req.session.user_id });
  }
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send("Please provide both email and password.");
  } else if (getUserByEmail(email, database)) {
    res.status(400).send("This email is already registered.");
  } else {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      id,
      email,
      password: hashedPassword,
    };
    database[id] = newUser;
    console.log(database);
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, database);
  if (!user) {
    return res.status(403).send("Username not found. Please register");
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Username or password do not match.");
  } else {

    req.session.user_id = user.id;
    console.log(req.session);
    res.redirect("/urls");
  }
});


app.get('/login', function (req, res) {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('login', { user: req.user });
  }
});

app.post('/logout', (req, res) => {

  req.session = null;
  res.redirect('/login');
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (longURL) {
    res.redirect(longURL.longURL);
  } else {
    res.status(404).render("error", { error: "This short URL does not exist." });
  }
});

const requireLogin = (req, res, next) => {
  const userId = req.session.user_id;
  console.log(req.session);
  if (!userId) {
    res.status(401).render("error", { error: "You must be logged in to view this page. Please <a href='/login'>login</a> to continue. " });

  } else {
    next();
  }
};

app.get("/urls/new", requireLogin, (req, res) => {
  const user = database[req.session.user_id]
  const templateVars = { user }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  const user = req.session.user_id;

  if (!user) {
    const message = "You need to be logged in to view this page.";
    res.status(401).render("error", { error: message });
  } else if (!url) {
    const message = "The requested URL does not exist.";
    res.status(403).render("error", { error: message });
  } else if (user !== urlDatabase[shortURL].userID) {
    const message = "You are not authorized to view this page.";
    res.status(404).render("error", { error: message });
  } else {
    res.render("urls_show", { shortURL, longURL: url.longURL, user: database[user] });
  }
});

app.post('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  const user = req.session.user_id;

  if (!user) {
    const error = 'You need to be logged in to edit URLs.';
    res.status(401).render('error', { error });
  } else if (user !== urlDatabase[shortURL].userID) {
    const error = 'You are not authorized to edit this URL.';
    res.status(403).render('error', { error });
  } else if (urlDatabase[shortURL]) {
    urlDatabase[shortURL].longURL = longURL;
    res.redirect('/urls');
  } else {
    const error = `Short URL ${shortURL} does not exist in the database.`;
    res.status(404).render('error', { error });
  }
});

app.post('/urls/:id/delete', (req, res) => {
  const urlId = req.params.id;
  const user = req.session.user_id;

  if (!user) {
    const error = 'You need to be logged in to delete URLs.';
    res.status(401).render('error', { error });
  } else if (user !== urlDatabase[urlId].userID) {
    const error = 'You are not authorized to delete this URL.';
    res.status(403).render('error', { error });
  } else {
    delete urlDatabase[urlId];
    res.redirect('/urls');
  }
});


const getUserUrl = (userID) => {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    const url = urlDatabase[shortURL];
    if (url.userID === userID) {
      userURLs[shortURL] = url;
    }
  }
  return userURLs;
}

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls", requireLogin, (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    res.status(401).render("error", { errorMessage: "Unauthorized access" });
    return;
  }

  const urls = getUserUrl(userID);
  console.log(urls);
  const templateVars = {
    urls,
    user: database[userID]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];
  if (!url) {
    res.status(404).render("error", { errorMessage: "Short URL not found" });
  } else if (url.userID !== req.session.user_id) {
    res.status(403).render("error", { errorMessage: "Unauthorized access" });
  } else {
    const templateVars = {
      shortURL: shortURL,
      longURL: url.longURL,
      user: database[req.session.user_id],
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];
  if (!url) {
    res.status(404).render("error", { errorMessage: "Short URL not found" });
  } else if (url.userID !== req.session.user_id) {
    res.status(403).render("error", { errorMessage: "Unauthorized access" });
  } else {
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];
  if (!url) {
    res.status(404).render("error", { errorMessage: "Short URL not found" });
  } else if (url.userID !== req.session.user_id) {
    res.status(403).render("error", { errorMessage: "Unauthorized access" });
  } else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
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

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
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