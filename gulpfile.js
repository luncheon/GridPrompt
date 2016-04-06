const gulp       = require('gulp');
const rimraf     = require('rimraf');
const ts         = require('gulp-typescript');
const babel      = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const electron   = require('electron-connect').server.create();

const tsProject  = ts.createProject('src/tsconfig.json');
const dest       = 'dist';

const tasks = {
  ts: () =>
    // async/await を利用する可能性を考慮して TypeScript => Babel しています
    // (target: es5 の async/await は TypeScript 2.0 で対応予定)
    // が、 async/await は不要かもしれません (TypeScript だけになれば sourcemaps も不要)。
    tsProject
      .src()
      .pipe(sourcemaps.init())
      .pipe(ts(tsProject))
      .pipe(babel({presets: ['es2015']}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(dest)),
  resources: () => gulp.src(['src/**/*.html', 'src/**/*.css']).pipe(gulp.dest(dest)),
  clean: () => rimraf.sync(dest),
  build: ['ts', 'resources'],
  watch: () => {
    electron.start();
    gulp.watch('src/main/**/*', sequential(['ts',    electron.restart]));
    gulp.watch('src/ui/**/*',   sequential(['build', electron./* reload */restart]));
  },
  default: sequential(['build', 'watch']),
};

Object.keys(tasks)
  .forEach(name => gulp.task(name, tasks[name]));

/**
 * タスクを逐次実行するタスクを作成します。
 */
function sequential(tasklist) {
  if (tasklist.length === 0) {
    return () => {};
  } else if (tasklist[0] instanceof Function) {
    return () => {
      const result = tasklist[0]();
      if (result && result.then instanceof Function) {
        result.then(sequential(tasklist.slice(1)));
      } else {
        sequential(tasklist.slice(1))();
      }
    };
  } else {
    // gulp.start() は削除予定となっていますが、代替 API はまだ提供されていないようです。
    //   Document gulp.start() · Issue #505 · gulpjs/gulp
    //   https://github.com/gulpjs/gulp/issues/505
    return () => gulp.start(tasklist[0], sequential(tasklist.slice(1)));
  }
}
