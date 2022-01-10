const express = require("express");
const bodyParser = require("body-parser");
const Sequelize = require("sequelize");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const PORT = 8000;
const User = require("./models").User;
const Task = require("./models").Task;

const db = new Sequelize("todo-final", "root", "", {
    host: "127.0.0.1",
    dialect: "mysql",
    operatorAliases: false,
});

db.authenticate()
    .then(() => console.log("Database connected!"))
    .catch((err) => console.log(`db.authenticate - ${err}`));

// App settings
app.set("view-engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    session({
        secret: "as[dasldaadakldk",
        resave: true,
        saveUninitialized: true,
    })
);

app.get("/", (req, res) => {
    if (req.session.loggedin) {
        const { username: name } = req.session;
        Task.findAll({
            where: { userId: req.session.userId },
        }).then((tasks) => {
            res.render("index.ejs", {
                name,
                tasks,
            });
        });
    } else {
        res.render("index.ejs");
    }
});

app.get("/login", (req, res) => {
    if (req.session.loggedin) {
        res.redirect("/");
    } else {
        res.render("login.ejs");
    }
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

app.get("/create-task", (req, res) => {
    res.render("create-task.ejs");
});

app.post("/auth/register", (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
        bcrypt.hash(password, 10).then((hashedPassword) => {
            User.create({
                username,
                password: hashedPassword,
            })
                .then((user) => res.redirect("/login"))
                .catch((err) => console.log(`Bcypt - ${err}`));
        });
    } else {
        console.log("Username and password must be filled");
    }
});

app.post("/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (username && password) {
        User.findOne({
            where: { username },
        })
            .then((user) => {
                if (user) {
                    bcrypt
                        .compare(password, user.password)
                        .then((matches) => {
                            if (matches) {
                                console.log("Log In Success");
                                req.session.loggedin = true;
                                req.session.username = user.username;
                                req.session.userId = user.id;
                                res.redirect("/");
                            } else {
                                console.log("Username or Password is invalid");
                                res.redirect("/login");
                            }
                        })
                        .catch((err) => console.log(`Bcrypt - ${err}`));
                } else {
                    console.log("Username or Password is invalid");
                    res.redirect("/login");
                }
            })
            .catch((err) => console.log(`FindOne - ${err}`));
    } else {
        console.log("Username and password must be filled");
    }
});

app.get("/auth/logout", (req, res) => {
    if (req.session.loggedin) {
        req.session.destroy((err) => {
            console.log(`Session.Destroy - ${err}`);
        });
    }
    res.redirect("/");
});

app.post("/task/create", (req, res) => {
    if (req.session.loggedin) {
        const { title, detail } = req.body;
        if (title && detail) {
            Task.create({
                title,
                detail,
                userId: req.session.userId,
            })
                .then((task) => res.redirect("/"))
                .catch((err) => console.log(`Task Create - ${err}`));
        }
    }
});

app.get("/task/:id/delete", (req, res) => {
    if (req.session.loggedin) {
        const { id } = req.params;
        Task.destroy({
            where: {
                id,
                userId: req.session.userId,
            },
        })
            .then((task) => res.redirect("/"))
            .catch((err) => console.log(`Task Destroy - ${err}`));
    }
});

app.listen(PORT, () => {
    console.log(`App is running on http://localhost:${PORT}`);
});
