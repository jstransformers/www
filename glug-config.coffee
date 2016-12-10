module.exports =

  transformers:

    stylus:
      use: [
        'jeet'
        'axis'
        'rupture'
      ]
    pug: true
    svgo: true
    csso: true
    autoprefixer: true
    'html-minifier': true
    'uglify-js': true

  pipelines:
    IMG:
      optimize:
        '**/*.svg': 'svgo'
    HTML:
      syntax:
        '**/*.pug': [
          'pug'
          'html-minifier'
        ]

    JS:
      syntax:
        '**/*.js': 'uglify-js'
        '**/*.coffee': [
          'coffee-script'
          'uglify-js'
        ]

    CSS:
      syntax:
        '**/*.styl': [
          'stylus'
          'autoprefixer'
          'csso'
        ]

