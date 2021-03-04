const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const ejs = require("ejs");
const LocalStrategy = require("passport-local").Strategy;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(
    session({
        secret: "Our little secret.",
        resave: false,
        saveUninitialized: false
    })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
    "mongodb+srv://admin-shikhar:SVERMA@123@cluster0.fmnu9.mongodb.net/covidDB",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
);
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    name: String,
    address: String,
    mobile: Number,
    status: String,
    age: Number,
    timeFirst: String
});

const adminSchema = new mongoose.Schema({
    name: String,
    email: String
});

const hospitalSchema = new mongoose.Schema({
    name: String,
    dosesCount: Number,
    queue: Number
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
adminSchema.plugin(passportLocalMongoose);
adminSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
const Admin = mongoose.model("Admin", adminSchema);

const saltRounds = 10;

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

// passport.deserializeUser(function (id, done) {
//     Admin.findById(id, function (err, user) {
//         done(err, user);
//     });
// });

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/admin-login", function (req, res) {
    res.render("admin-login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/dashboard", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("dashboard");
    } else {
        res.redirect("/login");
    }
});

app.post("/register", function (req, res) {
    User.register(
        {
            username: req.body.username,
            name: req.body.name,
            address: req.body.address,
            mobile: req.body.mobile,
            status: "Not Vaccinated",
            age: req.body.age,
            timeFirst: "Not Vaccinated"
        },
        req.body.password,
        function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/dashboard");
                });
            }
        }
    );
});

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/dashboard");
            });
        }
    });
});

app.listen(3000, function () {
    console.log("Server running on port 3000");
});
