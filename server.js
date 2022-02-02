require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const urlparser = require('url');

const mySecret = process.env['DB_URI']
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  url: { type: String, required: true },
  short: Number
});

const UrlModel = mongoose.model("UrlModel", urlSchema);

// Setting options for dns.lookup() method
const options = {

  // Setting family as 6 i.e. IPv6
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function(req, res) {
  var passedUrl = req.body.url;

  const query = UrlModel.where({ url: passedUrl });
  let inputShort = 1;






  query.findOne(function(err, data) {
    // if (err) return console.log(err);
    if (!err) {
      if (data) {
        res.send({ original_url: data.url, short_url: data.short });
      } else {

        dns.lookup(urlparser.parse(passedUrl).hostname, function(err, address, family) {
          if (!address) {
            res.send({ "error": "Invalid URL" });
          } else {


            UrlModel.findOne({}).sort({ short: 'desc' })
              .exec((error, result) => {

                if (!error) {
                  if (result) {
                    inputShort = result.short + 1;
                  }
                  UrlModel.create({ url: passedUrl, short:  inputShort}, function(saveErr, saveRes) {
                    if (!saveErr) {
                      res.send({ original_url: saveRes.url, short_url: saveRes.short });
                    }
                  });

                }
              });

          }
        });
      }
    }
  });
});




app.get('/api/shorturl/:id', function(req, res) {
  var id = req.params.id;

  const query  = UrlModel.where({ short: id });
  query.findOne(function(err, data)  {
    if (!err) {
      if (data) {
        res.redirect(data.url);
      }
      else{
        res.send({ "error": "Invalid URL" });
      }
    }
    else{
      res.send({ "error": "Invalid URL" });
    }
    
  });
});





app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
