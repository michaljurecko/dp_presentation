/* eslint-env node */
/* eslint no-console: "off" */
import gulp from 'gulp';
import gulpif from 'gulp-if';
import util from 'gulp-util';
import rename from 'gulp-rename';
import del from 'del';
import concat from 'gulp-concat';
import runSequence from 'run-sequence';
import eventStream from 'event-stream';
import streamqueue from 'streamqueue';
import plumber from 'gulp-plumber';
import uglify from 'gulp-uglify';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import compass from 'compass-importer';
import jade from 'gulp-jade';
import server from 'gulp-server-livereload';
import rollup from 'gulp-better-rollup';
import rollupBabel from 'rollup-plugin-babel';
import rollupNodeResolve from 'rollup-plugin-node-resolve';
import rollupCommonjs from 'rollup-plugin-commonjs';
import livereload from 'gulp-livereload';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
const config = {
  production: !!util.env.production,
  build_dir: 'web',
  jade: {
    'index.html': [
      'index.jade',
    ]
  },
  scripts: {
    'index.js': 'index.es6',
    'notes.js': 'notes.es6',
  },
  stylesheets: {
    'index.css': 'index.scss',
  },
  fonts: [
    'node_modules/reveal.js/lib/font/**/*',
    'font/**/*',
  ],
};

// -----------------------------------------------------------------------------
// Error handler
// -----------------------------------------------------------------------------
function onError(error) {
  util.log((error.plugin ? (`${error.plugin}: `) : ''), util.colors.red(error.message));
  this.emit('end');
}

// -----------------------------------------------------------------------------
// Jade
// -----------------------------------------------------------------------------
function mergeJade(options, target) {
  if (Array.isArray(options)) {
    options = { items: options };
  }

  options = Object.assign({
    uglify: {
      compress: true,
      mangle: false,
    },
  }, options);

  let stream = eventStream.merge([]); // empty stream
  options.items.forEach((module) => {
    stream = streamqueue({ objectMode: true },
      stream,
      typeof (module) === 'function' ? module() : gulp.src(module),
    );
  });

  return stream
      .pipe(jade())
      .pipe(concat(target))
      .pipe(gulpif(config.production, uglify(options.uglify)))
      .pipe(gulp.dest(config.build_dir))
      .pipe(livereload());
}

gulp.task('static', () => {
  return gulp.src('node_modules/reveal.js/plugin/notes/notes.html')
    .pipe(gulp.dest(config.build_dir));
});

gulp.task('jade', ['static'], () =>
  eventStream.merge(Object.keys(config.jade).map(target =>
    mergeJade(config.jade[target], target),
  )));

// -----------------------------------------------------------------------------
// Scripts
// -----------------------------------------------------------------------------
function mergeScripts(options, target) {
  if (typeof options === 'string') {
    options = { entrypoint: options };
  }

  options = Object.assign({
    uglify: {
      compress: true,
      mangle: false,
    },
  }, options);

  return gulp.src(options.entrypoint)
      .pipe(plumber(onError))
      .pipe(rollup({
        context: 'window',
        plugins: [
          rollupBabel({
            babelrc: false,
            presets: [['es2015', { modules: false }]],
            plugins: ['external-helpers'],
            exclude: 'node_modules/**',
          }),
          rollupNodeResolve({
            module: true,
            jsnext: true,
            browser: true,
            extensions: ['.js', '.json', '.es6'],
            preferBuiltins: true,
          }),
          // rollupCommonjs({
          //   include: 'node_modules/**',
          // }),
        ],
      }, {
        format: 'es',
      }))
      .pipe(gulpif(config.production, uglify(options.uglify)))
      .pipe(rename(target))
      .pipe(gulp.dest(config.build_dir))
      .pipe(livereload());
}

gulp.task('scripts', () =>
  eventStream.merge(Object.keys(config.scripts).map(target =>
    mergeScripts(config.scripts[target], target),
  )));

// -----------------------------------------------------------------------------
// Stylesheets
// -----------------------------------------------------------------------------
function compileStylesheet(src, target) {
  return gulp.src(src)
      .pipe(plumber(onError))
      .pipe(sass({
        importer: compass,
        outputStyle: config.production ? 'compressed' : 'compact',
      }))
      .on('error', sass.logError)
      .pipe(gulpif(config.production, autoprefixer()))
      .pipe(rename(target))
      .pipe(gulp.dest(config.build_dir))
      .pipe(livereload());
}

gulp.task('stylesheets', () =>
  eventStream.merge(Object.keys(config.stylesheets).map(target =>
    compileStylesheet(config.stylesheets[target], target),
  )));

// -----------------------------------------------------------------------------
// Clean
// -----------------------------------------------------------------------------
gulp.task('clean', () => del([
  `${config.build_dir}/*`,
  `${config.build_dir}/font/*`,
  `!${config.build_dir}/static`,
  '!.*',
]));

// -----------------------------------------------------------------------------
// Fonts
// -----------------------------------------------------------------------------
function processFonts(options) {
  if (typeof options === 'string') {
    options = { src: options };
  }

  return gulp.src(options.src)
      .pipe(plumber(onError))
      .pipe(rename({
        dirname: 'font',
      }))
      .pipe(gulp.dest(config.build_dir))
      .pipe(livereload());
}

gulp.task('fonts', () =>
  eventStream.merge(Object.keys(config.fonts).map(target =>
    processFonts(config.fonts[target], target),
  )));

// -----------------------------------------------------------------------------
// Default
// -----------------------------------------------------------------------------
gulp.task('default', () => {
  runSequence(
    'clean',
    ['scripts', 'stylesheets', 'jade', 'fonts'],
  );
});

// -----------------------------------------------------------------------------
// Watch
// -----------------------------------------------------------------------------
gulp.task('watch', ['default', 'server'], () => {
  gulp.watch('*.es6',  ['scripts']);
  gulp.watch('*.scss', ['stylesheets']);
  gulp.watch('*.jade', ['jade']);
});

// -----------------------------------------------------------------------------
// Server
// -----------------------------------------------------------------------------
gulp.task('server', () => {
  return gulp.src('./web/')
    .pipe(server({
      host: '0.0.0.0',
      port: 8888,
      defaultFile: 'index.html',
      livereload: true
    }));
});
