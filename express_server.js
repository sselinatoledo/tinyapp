const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;  //default port 8080

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function getUserByEmail(email, users) {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}
const urlsForUser = function (id, urlDatabase) {
  const userURLs = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

app.get('/register', (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    res.render('register', { user: req.user });
  }
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const { email, password } = req.body;
  const newUser = {
    id,
    email,
    password,
  };
  if (!email || !password) {
    res.status(400).send("Please provide email and password.");
  } else if (getUserByEmail(email, users)) {
    res.status(400).send("This email is already registered.");
  } else {
    users[id] = newUser;
    console.log(users);
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user || !bcrypt.compare(password, user.password)) {
    res.status(403).send("Invalid email or password");
  } else {
    const id = user.id;
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

app.get('/login', function (req, res) {
  if (req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    res.render('login', { user: req.user });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
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

const requireLogin = (req, res, next) => {
  const userId = req.cookies.user_id;
  if (!userId) {
    res.status(401).render("error", { message: "You must be logged in to view this page" });
  } else {
    next();
  }
};

app.get("/urls/new", requireLogin, (req, res) => {
  const user = users[req.cookies.user_id]
  const templateVars = { user }
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    const url = urlDatabase[shortURL];
    if (url.userID === req.cookies.user_id) {
      userURLs[shortURL] = url;
    }
  }
  const templateVars = {
    urls: userURLs,
    user: users[req.cookies.user_id]
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
      user: users[req.session.user_id]
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

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).render("error", { error: "This short URL does not exist." });
  }
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
