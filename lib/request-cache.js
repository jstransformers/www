'use strict';

// This file is just a copy of https://github.com/ForbesLindesay/http-basic/blob/master/lib/file-cache.js
// that has been modified to cache all requests for 5 minutes
//
// it caches on disc, so the cache is persisted even through server restarts

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

module.exports = new FileCache(__dirname + '/../cache');
function FileCache(location) {
  this._location = location;
}

FileCache.prototype.getResponse = function (url, callback) {
  var key = path.resolve(this._location, getCacheKey(url));

  fs.readFile(key + '.json', 'utf8', function (err, res) {
    if (err && err.code === 'ENOENT') return callback(null, null);
    else if (err) return callback(err);
    try {
      res = JSON.parse(res);
    } catch (ex) {
      return callback(ex);
    }
    var body = fs.createReadStream(key + '.body');
    res.body = body;
    callback(null, res);
  });
};
FileCache.prototype.setResponse = function (url, response) {
  var key = path.resolve(this._location, getCacheKey(url));
  var errored = false;

  fs.mkdir(this._location, function (err) {
    if (err && err.code !== 'EEXIST') {
      console.warn('Error creating cache: ' + err.message);
      return;
    }
    response.body.pipe(fs.createWriteStream(key + '.body')).on('error', function (err) {
      errored = true;
      console.warn('Error writing to cache: ' + err.message);
    }).on('close', function () {
      if (!errored) {
        fs.writeFile(key + '.json', JSON.stringify({
          statusCode: response.statusCode,
          headers: response.headers,
          requestHeaders: response.requestHeaders,
          requestTimestamp: response.requestTimestamp
        }, null, '  '), function (err) {
          if (err) {
            console.warn('Error writing to cache: ' + err.message);
          }
        });
      }
    });
  });
};

FileCache.prototype.canCache = function (res) {
  return true;
};
FileCache.prototype.isExpired = function (cachedResponse) {
  var time = (Date.now() - cachedResponse.requestTimestamp) / 1000;
  if (300 > time) { // cache everything for at least 5 minutes
    return false;
  }
  var match
  if (cachedResponse.headers['cache-control'] && (match = /^public\, *max\-age\=(\d+)$/.exec(cachedResponse.headers['cache-control']))) {
    if ((+match[1]) > time) {
      return false;
    }
  }
  if (cachedResponse.statusCode === 301 || cachedResponse.statusCode === 308) return false;
  return true;
};

function getCacheKey(url) {
  var hash = crypto.createHash('sha512')
  hash.update(url)
  return hash.digest('hex')
}