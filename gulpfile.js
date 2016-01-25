/*global require, console */

var gulp = require('gulp');
var replace = require('gulp-replace-task');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var nano = require('gulp-cssnano');
var connect = require('gulp-connect');
var gutil = require('gulp-util');
var ghPages = require('gulp-gh-pages');


/* Use a dependency chain to build in the correct order - starting with the final task.
    Each task has the dependcy of the previous task listed
*/
gulp.task('default', ['serve'], function () {

});


/* Build the appcache file. Updates the timestamp comment with the current date/time.  This is required to force a re-load of
    the cached files.
*/
gulp.task('appcachetimestamp', function () {
    gulp.src('src/smes-on-the-go.appcache')
        .pipe(replace({
            patterns: [
                {
                    match: 'timestamp',
                    replacement: new Date().getTime()
                    }
                ]
        }))
        .pipe(gulp.dest('build/'))
        .pipe(gulp.dest('dist/'));
});

/* Build the javascript - concatenates and minifies the files required to run.
 */
gulp.task('buildjs', ['appcachetimestamp'], function () {
    gulp.src(['src/map-styles.js', 'src/smes.js', 'src/places-autocomplete.js'])
        .pipe(concat('smes-on-the-go.js'))
        .pipe(gulp.dest('build/'))
        .pipe(rename('smes-on-the-go.min.js'))
        .pipe(uglify()).on('error', gutil.log)
        .pipe(gulp.dest('build/'))
        .pipe(gulp.dest('dist/'));
});

/* Minify the CSS used for Open Sesame (same is used for stand alone and chrome extension).
 */
gulp.task('minifycss', ['buildjs'], function () {
    gulp.src(['src/*.css'])
        .pipe(concat('smes-on-the-go.css'))
        .pipe(gulp.dest('build/'))
        .pipe(rename('smes-on-the-go.min.css'))
        .pipe(nano()).on('error', gutil.log)
        .pipe(gulp.dest('build/'))
        .pipe(gulp.dest('dist/'));
});

/* Make the build version of html pointing to the unminified js and css files
 */
gulp.task('buildhtml', ['minifycss'], function () {
    gulp.src(['src/index.html'])
        .pipe(replace({
            patterns: [
                {
                    match: 'cssfile',
                    replacement: 'smes-on-the-go.css'
                    }
                ]
        }))
        .pipe(replace({
            patterns: [
                {
                    match: 'jsfile',
                    replacement: 'smes-on-the-go.js'
                    }
                ]
        }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('build/'));
});

/* Make the dist version of html pointing to the minified js and css files
 */
gulp.task('disthtml', ['buildhtml'], function () {
    gulp.src(['src/index.html'])
        .pipe(replace({
            patterns: [
                {
                    match: 'cssfile',
                    replacement: 'smes-on-the-go.min.css'
                    }
                ]
        }))
        .pipe(replace({
            patterns: [
                {
                    match: 'jsfile',
                    replacement: 'smes-on-the-go.min.js'
                    }
                ]
        }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('dist/'));
});

/* Copy all the library files to the build and dist directories.
 */
gulp.task('copylibfiles', ['disthtml'], function () {
    gulp.src(['lib/gmaps.min.js', 'lib/xr.js'])
        .pipe(concat('sotg-lib.js'))
        .pipe(uglify()).on('error', gutil.log)
        .pipe(gulp.dest('build/'))
        .pipe(gulp.dest('dist/'));


    gulp.src(['lib/Promise.min.js'])
        .pipe(gulp.dest('build/'))
        .pipe(gulp.dest('dist/'));
});

/* Copy symbology files to the build and dist directories.
 */
gulp.task('copysymbology', ['copylibfiles'], function () {
    gulp.src(['src/symbology/*.png'])
        .pipe(gulp.dest('build/'))
        .pipe(gulp.dest('dist/'));
});


/* Copy favicon files to the build and dist directories.
 */
gulp.task('copyfavicon', ['copysymbology'], function () {
    gulp.src(['src/favicon.*'])
        .pipe(gulp.dest('build/'))
        .pipe(gulp.dest('dist/'));
});


/* Watch for changes to html and then reload when updated
 */
gulp.task('html', ['copyfavicon'], function () {
    gulp.src('./build/*.html')
        .pipe(connect.reload());
});

/* Standard server task */
gulp.task('serve', ['copyfavicon'], function () {
    connect.server({
        root: 'build',
        livereload: true
    });


    //Execute the html task anytime the source files change
    gulp.watch('src/*.*', ['html']);
    //gulp.watch("dist/*.*").on('change', browserSync.reload);
});

/* Task to deploy the built app to the github pages branch */
gulp.task('deploy', function () {

    return gulp.src('dist/**/*.*')
        .pipe(ghPages());
});
