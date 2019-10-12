var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

var connectMongo = process.env.connectMongo || "mongodb://localhost/webScrapper";
mongoose.connect(connectMongo);

app.get("/", function (req, res) {
    res.json(path.join(__dirname, "public/index.html"));
});


app.get("/scrape", function (req, res) {
    var URL = "https://weather.com/"
    axios.get(URL).then(function (response) {
        var $ = cheerio.load(response.data);

        $("div.wx-media-object").each(function (i, element) {

            var result = [];

            var link = $(element).parent().find("a").attr("href")
            var title = $(element).children().find("h3").text();
            var imageLink = $(element).parent().find("img.image").attr("src")

            result.push({
                title: title,
                link: link,
                image: imageLink,
            })

            db.Article.create(result)
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    console.log(err);
                });
        });

        res.send("Your Scrapping Is Complete");
    });
});


app.get("/articles", function (req, res) {

    db.Article.find({})
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get("/articles/:id", function (req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("note")
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.post("/articles/:id", function (req, res) {
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
