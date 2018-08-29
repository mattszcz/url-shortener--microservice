'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const dns = require('dns');
const url = require('url');

const cors = require('cors');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


// database
const schema = new mongoose.Schema({ 
  url: String, 
  id: { type: Number, ref: 'id', default: 0 } 
});
const UrlShortener = mongoose.model('UrlShortener', schema);

const findByUrl = function(url, done) {
  UrlShortener.findOne({url: url}).exec((err, data) => {
    if (err) return done(err);
    done(null, data);
  })
};
const findById = function(id, done) {
  UrlShortener.findOne({id: id}).exec((err, data) => {
    if (err) return done(err);
    done(null, data);
  })
};
const createAndSave = function(url, done) {
  UrlShortener.findOne({}).sort('-id').exec((err, data) => {
    if (err) return done(err)
    if (!data) data = {id: 0}
    const document = new UrlShortener({url: url, id: data.id+1})
    document.save(function(err, data) {
      if (err) return done(err)
      done(null , data);
    });
  });
};


// my routes
app.post("/api/shorturl/new", function (req, res) {
  if (!req.body) return res.sendStatus(400)
  dns.lookup(url.parse(req.body.url, true).hostname, (err, address, family) => {
    if (err || !address) return res.json({error: "invalid URL"});
    console.log('address: %j family: IPv%s', address, family);
    findByUrl(req.body.url, (err, data) => {
      if (err) return console.log(err);
      if (data) return res.json({original_url: data.url, short_url: data.id});
      createAndSave(req.body.url, (err, data) => {
        if (err) return console.log(err);
        res.json({original_url: data.url, short_url: data.id});
      })
    })
  })
});

app.get('/api/shorturl/:id', function (req, res) {
  findById(req.params.id, (err, data) => {
    if (err) return console.log(err)
    if (data) res.redirect(data.url)
  })
})


app.listen(port, function () {
  console.log('Node.js listening ...');
});