var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

//scraping tools
var axios = require("axios");
var cheerio = require("cheerio");

//pulls in all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

//initializing express
var app = express();

//sets morgan for logging requests
app.use(logger("dev"));
//bodyparsing for forms
app.use(bodyParser.urlencoded({ extended: true }));
//sets static dir
app.use(express.static("public"));

//creates connection for mongoDB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines"
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

//routes

app.get("/scrape", function (req, res) {
    //grabs html body
    axios.get("http://www.echojs.com/").then(function (response) {
        //load into cheerio
        var $ = cheerio.load(response.data);

        //grabs all g3 with article tags
        $("article h2").each(function (i, element) {
            var result = {};

            //saves texts and links as properties of the object
            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");

            //create new articles using result
            db.Article.create(result)
                .then(function(dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function(err) {
                    return res.json(err);
                });

        });

        // res.send("Scraping done");
        res.redirect("/");
    });
});

app.get("/articles", function(req, res) {
    //grab all documents
    db.Article.find({})
        //if articles are found send back
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        //if error send back
        .catch(function(err) {
            res.json(err);
        });
});

//article search
app.get("/articles/:id", function(req, res) {
    //searches for matching id
    db.Article.findOne({ _id: req.params.id })
        //show notes connected
        .populate("note")
        .then(function(dbArticle) {
            //if article found send back
            res.json(dbArticle);
        })
        .catch(function(err) {
            //if error send back
            res.json(err);
        });
});

//article save&update 
app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
        .then(function(dbNote) {

            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id}, { new: true});
        })
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

app.listen(PORT, function() {
    console.log("App is running on port " + PORT + "!");
});