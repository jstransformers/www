'use strict';

var express = require('express');

var app = express();

var api = require('./lib/api');

app.set('views', __dirname + '/views');
app.use(function (req, res, next) {
  api.getRepos().done(function (transformers) {
    req.transformers = transformers;
    res.locals.transformers = transformers;
    next();
  }, next);
});
app.get('/', function (req, res) {
  res.render('home.jade');
});
app.get('/jstransformer/:name', function (req, res, next) {
  var transformers = req.transformers.filter(function (tr) {
    return tr.name == req.params.name;
  });
  if (transformers.length !== 1) return next();
  res.render('transformer.jade', {transformer: transformers[0]});
});
app.get('/style/index.css', function (req, res) {
  res.sendFile(__dirname + '/style/index.css');
});

app.listen(3000);