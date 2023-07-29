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
function urlsForUser(userId, urlDatabase)
{
    const urls = [];
    for (const shortURL in urlDatabase) {
        const urlentry = urlDatabase[shortURL];
        if(urlentry.userID === userId)
        {
            urls.push(urlentry);
        }
    }
    return urls;
}

app.get('/register', (req, res) => {
    res.render('register');
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
    const { email, password }= req.body;
    const user = getUserByEmail(email, users);

    if (!user || !bcrypt.compare(password, user.password)) {
      res.status(403).send("Invalid email or password");
    } else {
        const id = user.id;
        res.cookie("user_id", id);
        res.redirect("/urls");
    }
  });

  app.get('/login', function(req, res) {
    res.render('login');
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

app.get("/urls/new", (req, res) => {
    const user = users[req.cookies.user_id]
    const templateVars = {user}
    res.render("urls_new",templateVars);
});

app.get("/urls", (req, res) => {
    const user = users[req.cookies.user_id]
    console.log("inside /urls", users);
    console.log(req.cookies);
    const templateVars = { urls: urlsForUser(req.cookies.user_id, urlDatabase), user };
    res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
    const user = users[req.cookies.user_id]
    const templateVars = { id: req.params.id, user, longURL: urlDatabase[req.params.id] };
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
