'use strict';

var fs = require('fs');
var acorn = require('acorn');
var Promise = require('promise');
var createGitHubClient = require('github-basic');

var github = createGitHubClient({version: 3, cache: require('./request-cache')});

function getAllRepos() {
  function recurse(result, latestResult) {
    if (!latestResult.getNext) return result;
    else return latestResult.getNext().then(function (nextResult) {
      return recurse(result.concat(nextResult), nextResult);
    });
  }
  return github.get('/orgs/:org/repos', {org: 'jstransformers'}).then(function (result) {
    return recurse(result.slice(), result);
  });
}
function getIndex(name) {
  return github.getBuffer('https://raw.githubusercontent.com/jstransformers/jstransformer-' + name + '/master/index.js').then(function (buffer) {
    return buffer.toString('utf8');
  }, function (err) {
    console.dir(name);
    return '';
  });
}
function analyse(src) {
  // analyse using acorn to avoid having to execute any un-trusted code
  var analysis = {implementedMethods: []};
  acorn.parse(src, {ecmaVersion: 6}).body.forEach(function (node) {
    if (node.type === 'ExpressionStatement') {
      node = node.expression;
    }
    if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && !node.left.computed && node.left.object.type === 'Identifier' && node.left.object.name === 'exports') {
      switch (node.left.property.name) {
        case 'name':
          if (node.right.type === 'Literal') analysis.name = node.right.value;
          break;
        case 'inputFormats':
          if (node.right.type === 'ArrayExpression') {
            analysis.inputFormats = node.right.elements.filter(function (node) {
              return node.type === 'Literal';
            }).map(function (node) {
              return node.value;
            });
          }
          break;
        case 'outputFormat':
          if (node.right.type === 'Literal') analysis.outputFormat = node.right.value;
          break;
        default:
          analysis.implementedMethods.push(node.left.property.name);
          break;
      }
    }
  });
  return analysis;
}
exports.getRepos = function () {
  return getAllRepos().then(function (res) {
    return res.filter(function (repo) {
      return /^jstransformer-/.test(repo.name);
    }).map(function (repo) {
      return {
        url: repo.html_url,
        name: repo.name.substr(14),
        full_name: repo.name,
        description: repo.description,
        stargazers_count: repo.stargazers_count,
        watchers_count: repo.watchers_count,
        forks_count: repo.forks_count,
        open_issues_count: repo.open_issues_count
      };
    });
  }).then(function (repos) {
    return Promise.all(repos.map(function (repo) {
      return getIndex(repo.name).then(analyse).then(function (analysis) {
        repo.analysis = analysis;
        return repo;
      });
    }));
  });
}