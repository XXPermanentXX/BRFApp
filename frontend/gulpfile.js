/* eslint no-console: off */

// Load environement variables
require('dotenv').config({ path: '../.env' });

var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var inject = require('gulp-inject');
var watch = require('gulp-watch');

var paths = {
  sass: ['./scss/**/*.scss'],
  javascript: [
    './www/**/*.js',
    '!./www/app/shared/config.js',
    '!./www/admin/**',
    '!./www/app/app.js',
    '!./www/lib/**'
  ]
};

gulp.task('default', ['sass','index','sass-admin']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('sass-admin', function(done) {
  gulp.src('./scss/admin.scss')
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(gulp.dest('./www/admin/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/admin/css/'))
    .on('end', done);
});

gulp.task('index', function(done) {
  gulp.src('./www/index.html')
    .pipe(inject(gulp.src(paths.javascript, {starttag: '<!-- inject:js -->', read: false}), {relative: true}))
    .pipe(inject(gulp.src(['./www/app/shared/config.js']), {
      starttag: '<!-- inject:config -->',
      transform: function (filePath, file) {
        const content = file.contents.toString('utf8');

        return [
          '<script>',
          content.replace(/{{\s*(\w+)\s*}}/g, function (match, key) {
            return process.env[key];
          }).replace(/\n\s*/gm, ''),
          '</script>'
        ].join('');
      }
    }))
    .pipe(gulp.dest('./www'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass','sass-admin']);
  // gulp.watch(paths.javascript, ['index']);
  watch(paths.javascript, {events:['add','unlink']}, function () {
        gutil.log("Test");
        gulp.start('index');
    });
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});
