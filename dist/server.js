'use strict';

var MONGOLAB_URI = 'mongodb://admin:hhhthegame0207@ds123454.mlab.com:23454/fcc-challenge';
var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
var URL = require('url').URL;

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect(MONGOLAB_URI);
var linkSchema = new mongoose.Schema({
    originalUrl: String,
    shortenedUrl: Number
});
var Link = mongoose.model('Link', linkSchema);

//Common error callback
var errorOccurred = function errorOccurred(res) {
    console.log('Sending error response');
    res.status(404).end();
};

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
    res.json({ greeting: 'hello API' });
});

//Implementing microservice
app.get('/api/shorturl/:link_id', function (req, res) {
    var linkNumber = parseInt(req.params.link_id);
    if (isNaN(linkNumber)) {
        errorOccurred(res);
    }
    Link.findOne({
        shortenedUrl: linkNumber
    }, function (err, data) {
        if (err) {
            errorOccurred(res);
        }
        res.redirect(data.originalUrl);
    });
}).post('/api/shorturl/:link_id', function (req, res) {
    if (req.params.link_id === 'new') {
        var originalUrl = req.body.url;
        var jsonResponse = {
            error: 'invalid URL'
        };
        var hostName = new URL(originalUrl).hostname;
        dns.lookup(hostName, function (err, address, family) {
            if (err) {
                console.log('sending error');
                res.status(500).send({ jsonResponse: jsonResponse }).end();
            }
            var maxUrl = 0;
            Link.find({
                shortenedUrl: { $gte: 0 }
            }).sort('-shortenedUrl').limit(1).exec(function (err, result) {
                if (err) {
                    errorOccurred(res);
                }
                console.log('result', result);
                if (result.length > 0) {
                    console.log('here1');
                    maxUrl = result[0].shortenedUrl + 1;
                } else {
                    console.log('here');
                    maxUrl = 1;
                }
                console.log('value', maxUrl);
                var link = new Link({
                    originalUrl: originalUrl,
                    shortenedUrl: maxUrl
                });
                link.save(function (err, result) {
                    if (err) {
                        errorOccurred(res);
                    }
                    res.json({
                        original_url: result.originalUrl,
                        shortened_url: maxUrl
                    });
                });
            });
        });
    } else {
        errorOccurred(res);
    }
});

app.listen(port, function () {
    console.log('Node.js listening ...');
});