var express = require('express');
var minifyHTML = require('express-minify-html');
var mongoose = require('mongoose');
var path = require('path');
var favicon = require("serve-favicon");
var logger = require('morgan');
var bodyParser = require('body-parser');
var compression = require('compression');
var passport = require('passport');
var session = require('express-session');
var httpsRedirect = require('express-https-redirect');
var Job = require('./models/job');
var User = require('./models/user');
var Resume = require('./models/resume');
var uglifyJs = require("uglify-js");
var fs = require('fs');

require('./models/db');

var user = require('./routes/user');
var admin = require('./routes/admin');
var setuppassport = require('./setuppassport');
var app = express();
setuppassport();

// GZIP all assets
app.use(minifyHTML({
    override:      true,
    exception_url: false,
    htmlMinifier: {
        removeComments:            true,
        collapseWhitespace:        true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes:     true,
        removeEmptyAttributes:     true,
        minifyJS:                  true,
        minifyCSS:                 true
    }
}));
app.use(compression());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/', httpsRedirect());

var appFiles = [
    fs.readFileSync('public/lib/angular-route.min.js', "utf8"),
    fs.readFileSync('public/lib/dist/angular-animate.min.js', "utf8"),
    fs.readFileSync('public/lib/dist/angular-sanitize.min.js', "utf8"),
    fs.readFileSync('public/lib/dist/ng-file-upload.min.js', "utf8"),
    fs.readFileSync('public/lib/angular-chosen.min.js', "utf8"),
    fs.readFileSync('public/lib/dist/build/wysiwyg.min.js', "utf8"),
    fs.readFileSync('public/lib/ngDialog/js/ngDialog.min.js', "utf8"),
    ];
var uglified = uglifyJs.minify(appFiles, { compress : false });
fs.writeFile('public/angular/bossworkerFile.min.js', uglified.code, function (err){
    if(err) {
    console.log(err);
  } else {
    console.log('Script generated and saved: bossworkerFile.min.js');
  }
});

var appClientFiles = [
    fs.readFileSync('public/lib/app.js', "utf8"),
    fs.readFileSync('public/lib/user/login.controller.js', "utf8"),
    fs.readFileSync('public/lib/user/register.controller.js', "utf8"),
    fs.readFileSync('public/lib/user/addjob.controller.js', "utf8"),
    fs.readFileSync('public/lib/user/editjob.controller.js', "utf8"),
    fs.readFileSync('public/lib/user/managejob.controller.js', "utf8"),
    fs.readFileSync('public/lib/user/manageresume.controller.js', "utf8"),
    fs.readFileSync('public/lib/user/browsejob.controller.js', "utf8"),
    fs.readFileSync('public/lib/user/home.controller.js', "utf8"),
    ];
var uglified = uglifyJs.minify(appClientFiles, { compress : false });
fs.writeFile('public/angular/bossworker.min.js', uglified.code, function (err){
    if(err) {
    console.log(err);
  } else {
    console.log('Script generated and saved: bossworker.min.js');
  }
});
var appPluginFiles = [
    fs.readFileSync('public/scripts/custom.js', "utf8"),
    fs.readFileSync('public/scripts/chosen.jquery.min.js', "utf8"),
    fs.readFileSync('public/scripts/jquery.superfish.js', "utf8"),
    fs.readFileSync('public/scripts/jquery.superfish.js', "utf8"),
    fs.readFileSync('public/scripts/jquery.counterup.min.js', "utf8"),
    fs.readFileSync('public/scripts/jquery.jpanelmenu.js', "utf8"),
    fs.readFileSync('public/scripts/stacktable.js', "utf8"),
    fs.readFileSync('public/scripts/headroom.min.js', "utf8"),
    ];
var uglified = uglifyJs.minify(appPluginFiles, { compress : false });
fs.writeFile('public/angular/bossworkerPlugin.min.js', uglified.code, function (err){
    if(err) {
    console.log(err);
  } else {
    console.log('Script generated and saved: bossworkerPlugin.min.js');
  }
});
// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public','images', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/user',session({
  name: 'user_sid',
  secret: "JHGF>,./?;;LJ8#$?,KL:>>>,,KJJJDHE",
  resave: true,
  saveUninitialized: true,
  cookie: {
    path: '/user',
  }
}));
app.use('/manage/admin',session({
  name: 'admin_sid',
  secret: "JHGF>,./?;;LJ8#$?,KL:>>>,,KJJJDHE",
  resave: true,
  saveUninitialized: true,
  cookie: { 
    path: '/manage/admin',
  }
}));


app.use(passport.initialize());
app.use(passport.session());
app.use('/user', user);
app.use('/manage/admin', admin);


app.all('*', function(req, res) {
 res.redirect("/user");
});

setInterval(function() {
    Job.update({
        expiresOn: {
            $lte: new Date()
        }
    }, {
        $set: {
            status: "expired"
        }
    }, {
        multi: true
    }, function(err) {
        if (err) {
            return;
        }
    });
    Resume.update({
        expiresOn: {
            $lte: new Date()
        }
    }, {
        $set: {
            status: "expired"
        }
    }, {
        multi: true
    }, function(err) {
        if (err) {
            return;
        }
    });
}, 5000);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('user/error');
});

module.exports = app;
