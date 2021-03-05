require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const ejs = require("ejs");
const bcrypt = require("bcrypt");

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

const saltRounds = 10;

const id = process.env.ID;
const password = process.env.PASSWORD;
const database_url =
    "mongodb+srv://" +
    id +
    ":" +
    password +
    "@cluster0.fmnu9.mongodb.net/covidDB";

mongoose.connect(database_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
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
    email: String,
    password: String
});

const hospitalSchema = new mongoose.Schema({
    name: String,
    address: String,
    mobile: Number,
    dosesCount: Number,
    queue: Number
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
adminSchema.plugin(passportLocalMongoose);
adminSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Hospital = mongoose.model("Hospital", hospitalSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/hospital", function (req, res) {
    res.render("hospital");
});

app.get("/admin-login", function (req, res) {
    res.render("admin-login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/dashboard", function (req, res) {
    if (req.isAuthenticated()) {
        Hospital.find({}, function (err, results) {
            if (err) {
                console.log(err);
            } else {
                res.render("dashboard", { user: req.user, hospitals: results });
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/admin-dashboard", function (req, res) {
    res.render("admin-dashboard");
});

app.post("/register", function (req, res) {
    User.register(
        {
            username: req.body.username,
            name: req.body.name,
            address: req.body.address,
            mobile: req.body.mobile,
            status: "Yet to be Vaccinated",
            age: req.body.age,
            timeFirst: "N/A"
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

// app.post("/register", function (req, res) {
//     bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
//         const newadmin = new Admin({
//             name: req.body.name,
//             username: req.body.username,
//             password: hash
//         });
//         newadmin.save(function (err) {
//             if (err) {
//                 console.log(err);
//             } else {
//                 res.render("home");
//             }
//         });
//     });
// });

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

app.post("/admin-login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    Admin.findOne({ username: username }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                bcrypt.compare(
                    password,
                    foundUser.password,
                    function (err, result) {
                        if (result === true) {
                            res.redirect("/admin-dashboard");
                        } else {
                            res.send("Incorrect Password");
                        }
                    }
                );
            } else {
                res.redirect("/admin-login");
            }
        }
    });
});

app.post("/hospital", function (req, res) {
    const newHospital = new Hospital({
        name: req.body.name,
        address: req.body.address,
        mobile: req.body.mobile,
        dosesCount: 0,
        queue: 0
    });
    newHospital.save(function () {
        res.redirect("/hospital");
    });
});

app.listen(3000, function () {
    console.log("Server running on port 3000");
});
