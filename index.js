var api = require('./lib/api');
var jstransformer = require('jstransformer');
var jade = require('jstransformer')(require('jstransformer-jade'));
var fs = require('fs');
var rimraf = require('rimraf');

function write(transformers) {
  // Render the homepage.
  jade.renderFileAsync('views/home.jade', {
    pretty: true,
    transformers: transformers
  }).then(function (res) {
    fs.writeFileSync('out/index.html', res.body);
  });

  // Render each transformer.
  transformers.forEach(function (transformer, index) {
    jade.renderFileAsync('views/transformer.jade', {
      pretty: true,
      transformer: transformer
    }).then(function (res) {
      fs.writeFileSync('out/' + transformer.name + '.html', res.body);
    });
  });

  // Copy the style.
  fs.writeFileSync('out/style.css', fs.readFileSync('style/index.css'));
}

// Clear the out directory before re-building.
rimraf('out', function() {
  // Rebuild the out directory, and then write the files.
  fs.mkdir('out', function() {
    api.getRepos().then(write);
  });
});
