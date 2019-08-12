var express = require('express');

var User = require('../models/user');
var Admin = require('../models/admin');
var Post = require('../models/post');
var Job = require('../models/job');
var passport = require('passport');
var moment = require('moment');
var Multer = require('multer');
var striptags = require('striptags');
var mime = require('mime-types');
var fs = require('fs');
var shortid = require('shortid');
var routeradmin = express.Router();


Admin.find({}, function(err, admin){
  if(err){ return;}
  if(admin.length == 0){
      var newAdmin = new Admin({
            firstname: "Boss",
            lastname: "Worker",
            email: "bossworker@gmail.com",
            password: "11223344E"
          });
       newAdmin.save(function(err, admin){
            if (err) { 
              console.log(err);
              return; 
            }else{
               console.log(admin);
              
          }
      });
  }
})

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
   next();
  } else {
    res.redirect("/manage/admin/login");
  }
};

function Authenticated(req, res, next) {
  if (req.isAuthenticated()) {
       res.redirect('/manage/admin/dashboard');
  }else {
     next();
  }
};

routeradmin.use(function(req, res, next){
  res.locals.currentadmin = req.user;
  res.locals.moment = moment;
  res.locals.striptags = striptags;
  next();
});

var sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

var Storage = Multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, 'public/upload/file')
    },
    filename: function (req, file, cb) {
        cb(null, shortid.generate()+"."+ mime.extension(file.mimetype))
    }
});

var coverUpload = Multer({ //multer settings
    storage: Storage,
    fileFilter: function(req, file, cb){
      if(file.mimetype !== mime.lookup('jpg') && file.mimetype !== mime.lookup('png')){
        req.fileValidationError = "Only jpg,png files are allowed";
        return cb(new Error('Only jpg files are allowed'))
      }
      cb(null, true)
    }
}).single('file');

var logoStorage = Multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, 'public/upload/file')
    },
    filename: function (req, file, cb) {
        cb(null, shortid.generate()+"."+ mime.extension(file.mimetype))
    }
});

var logoupload = Multer({ //multer settings
    storage: logoStorage,
    fileFilter: function(req, file, cb){
      if(file.mimetype !== mime.lookup('jpg') && file.mimetype !== mime.lookup('png')){
        req.fileValidationError = "Only jpg, png files are allowed";
        return cb(new Error('Only jpg files are allowed'))
      }
        cb(null, true)
    }
}).single('file');

routeradmin.param('postId', function(req, res, next, id) {
  Post.findOne({ postId: id }, function(err, post) {
    if (err) {return res.redirect("/manage/admin/manage-blog") };
    if (!post) {return res.redirect("/manage/admin/manage-blog") };
    req.post = post;
    next();
  });
});

/* GET home page. */

routeradmin.get('/login', Authenticated, function(req, res, next) {
  res.render('admin/login', {
        title: 'login'
    });
});

routeradmin.post('/login', function(req, res, next) {
      passport.authenticate('admin-local', {failureFlash:true}, function(err, user, info) {
       if(!req.body.password || !req.body.email){
          sendJSONresponse(res, 400, {"message": "Enter your Email Address and Password"});
          return;
        }
       if (err) { return next(err); }
       if (!user) { 
          sendJSONresponse(res, 400, {"message": "Invalied Login Credentials"});
          return;
        }
      req.logIn(user, function(err) {
        if (err) { return next(err); }
         sendJSONresponse(res, 200, {"message": "Login successfully please wait,,,,"});
          return;
     });
    })(req, res, next);
    });




routeradmin.get('/dashboard', ensureAuthenticated, function(req, res, next) {
   res.render('admin/dashboard', {
        title: 'dashboard'
    });
});

routeradmin.get('/add-job', ensureAuthenticated, function(req, res, next) {
  res.render('admin/add_job', {
        title: 'Bossworker - Add jobs',
    });
});

routeradmin.get('/manage-blog', ensureAuthenticated, function(req, res, next) {
  var perPage = 3
  var page = req.params.page || 1

  Post.find({})
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .sort({created:-1}) 
    .exec(function(err, posts) {
       Post.count().exec(function(err, count) {
                if (err) return next(err)
                res.render('admin/manage-blog', {
                    posts: posts,
                    current: page,
                    pages: Math.ceil(count / perPage),
                    title: 'manage-blog'
                })
            })
    });
});

routeradmin.get('/manage-blog/page/:page', ensureAuthenticated, function(req, res, next) {
  var perPage = 3
  var page = req.params.page || 1

  Post.find({})
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .exec(function(err, posts) {
       Post.count().exec(function(err, count) {
                if (err) return next(err)
                res.render('admin/manage-blog', {
                    posts: posts,
                    current: page,
                    pages: Math.ceil(count / perPage),
                    title: 'manage-blog'
                })
            })
    });
});


routeradmin.get('/manage-jobs', ensureAuthenticated, function(req, res, next) {
  var perPage = 5
  var page = req.query.page || 1;
  var search = req.query.search;
  if(req.query.search){
    Job.find({$text: {$search: req.query.search}},
     { score: { $meta: "textScore" } })
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .populate('user')
    .sort( { score: { $meta: "textScore" } } )
    .exec(function(err, jobs) {
       Job.count({$text: {$search: req.query.search}}).exec(function(err, count) {
                if (err) return next(err)
                res.render('admin/manage-jobs', {
                    jobs: jobs,
                    current: page,
                    search: search,
                    pages: Math.ceil(count / perPage),
                    title: 'manage-jobs'
                })
            })
    });
  }else{
     Job.find({})
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .sort({createdOn:-1}) 
    .populate('user')
    .exec(function(err, jobs) {
       Job.count({}).exec(function(err, count) {
                if (err) return next(err)
                res.render('admin/manage-jobs', {
                    jobs: jobs,
                    current: page,
                    search: search,
                    pages: Math.ceil(count / perPage),
                    title: 'manage-jobs'
                })
            })
    });
  }
});

routeradmin.get('/edit-job/:id', ensureAuthenticated, function(req, res, next) {
  Job.findOne({ jobId: req.params.id}, function(err, job) {
    if (err) { return next(err); }
    if (!job) { return res.redirect('/manage/admin/manage-jobs'); }
    res.render('admin/edit-job', {
        job: job,
        title: 'Bossworker - Edit job',
        pageTitle: 'edit-job',
        maintitle: 'employee'
    });
  });
});

routeradmin.post('/editjob/:id', ensureAuthenticated, function(req, res, next) {
     logoupload(req,res,function(err){
        if(!req.body.title || !req.body.location || !req.body.type || !req.body.cat || !req.body.aboutJob  || !req.body.paymentType || !req.body.comName ){
             sendJSONresponse(res, 400, {"message": "Please fill all the field without Optional (OPTIONAL) currectly"});
             return;
        }
        if(req.body.paymentType != "Negotiable" && !req.body.payment){
             sendJSONresponse(res, 400, {"message": "Please enter payment "});
             return;
        }
        if(req.fileValidationError){
             sendJSONresponse(res, 400, {"message": req.fileValidationError});
             return;
        }
       if(!req.file){
          var updateJob = {
            jobTitle : req.body.title,
            location : req.body.location,
            jobType : req.body.type,
            category : req.body.cat.split(','),
            aboutJob: req.body.aboutJob,
            dis: req.body.dis,
            paymentType: req.body.paymentType,
            payment: req.body.payment,
            companyName:req.body.comName,
            website:req.body.comWebsite,
            email:req.body.comEmail,
            phone:req.body.comPhone,
            address: req.body.comAddress,
            logo: "cover.png"
          }
        }else{
          var updateJob  = {
            jobTitle : req.body.title,
            location : req.body.location,
            jobType : req.body.type,
            category : req.body.cat.split(','),
            aboutJob: req.body.aboutJob,
            dis: req.body.dis,
            paymentType: req.body.paymentType,
            payment: req.body.payment,
            companyName:req.body.comName,
            website:req.body.comWebsite,
            email:req.body.comEmail,
            phone:req.body.comPhone,
            address: req.body.comAddress,
            logo:  req.file.filename
          }
        }
        Job.update({_id: req.params.id}, updateJob, function(err) {
          if (err) {   return next(err); }
             sendJSONresponse(res, 200, {"message": "Job updated sucessfully"});
              return;
        });
     })
    
});
routeradmin.post('/removejob/:id',  ensureAuthenticated, function(req, res, next) {
    Job.findOneAndRemove({ _id: req.params.id },function(err,job) {
         if (err) { return next(err); }
         if(job.logo != "cover.png"){
            fs.unlink("public/upload/file/"+job.logo, function(err){
              if (err && err.code == "ENOENT") {
                console.log("file doesnt exist");
              } else if(err) {
                 console.log("error");
              }else{
                  console.log("file removed");
              }
             });
         }
         sendJSONresponse(res, 200, {"message": "sucessfully"});
    });
});

routeradmin.get('/add-blog-post', ensureAuthenticated, function(req, res, next) {
  res.render('admin/add-blog-post', {
        title: 'add-blog-post'
    });
});

routeradmin.get('/edit-blog-post/:postId', ensureAuthenticated, function(req, res, next) {
  res.render('admin/edit-blog-post', {
        title: 'edit-blog-post',
        post: req.post
    });
});

routeradmin.get('/blog-single-post/:postId', ensureAuthenticated, function(req, res, next) {
  res.render('admin/blog-single-post', {
      title: 'Showing post - ' + req.post.subject,
       post: req.post
    });
});

// Add comment
routeradmin.post('/post/comment/:id', ensureAuthenticated, function(req, res, next) {
   if(!req.body.name || !req.body.body ){
         return;
    }
  var data = {
      name: req.body.name,
      body: req.body.body,
      created: new Date()
  };
  Post.findOneAndUpdate({ postId: req.params.id }, {
    $push: { comments: data }}, { new: true }, function(err, comment) {
       if (err) { 
              return next(err); 
            }else{
              sendJSONresponse(res, 200, {"message": " Posted sucessfully"});

          }
  });
});

routeradmin.post('/add-blog-post', ensureAuthenticated, function(req, res, next) {
     coverUpload(req, res, function(err){
        if(req.fileValidationError){
             sendJSONresponse(res, 400, {"message": req.fileValidationError});
             return;
        }
        if(!req.file){
           sendJSONresponse(res, 400, {"message": "Cover photo is required!"});
           return;
        }
          var newPost = new Post({
            author: req.user._id,
            subject : req.body.subject,
            body : req.body.message,
            created: new Date(),
            cover:  req.file.filename
          });
     newPost.save(function(err, post){
            if (err) { 
                console.log(err);
              return next(err); 
            }else{
               console.log(post);
               sendJSONresponse(res, 200, {"message": " Posted sucessfully"});
          }
      });
     })
});

routeradmin.post('/addjob', ensureAuthenticated, function(req, res, next) {
     logoupload(req,res,function(err){
        if(!req.body.title || !req.body.location || !req.body.type || !req.body.cat || !req.body.aboutJob  || !req.body.paymentType || !req.body.comName ){
             sendJSONresponse(res, 400, {"message": "Please fill all the required fields"});
             return;
        }
        if(req.fileValidationError){
             sendJSONresponse(res, 400, {"message": req.fileValidationError});
             return;
        }
       if(!req.file){
          var newjob = new Job({
            jobTitle : req.body.title,
            location : req.body.location,
            jobType : req.body.type,
            category : req.body.cat.split(','),
            aboutJob: req.body.aboutJob,
            paymentType: req.body.paymentType,
            payment: req.body.payment,
            companyName:req.body.comName,
            website:req.body.comWebsite,
            email:req.body.comEmail,
            phone:req.body.comPhone,
            address: req.body.comAddress,
            status: 'Posted',
            accountType: 'admin',
            logo: "cover.png"
          });
        }else{
          var newjob = new Job({
            jobTitle : req.body.title,
            location : req.body.location,
            jobType : req.body.type,
            category : req.body.cat.split(','),
            aboutJob: req.body.aboutJob,
            paymentType: req.body.paymentType,
            payment: req.body.payment,
            companyName:req.body.comName,
            website:req.body.comWebsite,
            email:req.body.comEmail,
            phone:req.body.comPhone,
            address: req.body.comAddress,
            status: 'Posted',
            accountType: 'admin',
            logo:  req.file.filename
          });
        }
     newjob.save(function(err, job){
            if (err) { 
              return next(err); 
            }else{
              sendJSONresponse(res, 200, {"message": "Job posted sucessfully","jobId": job._id});
          }
      });
     })
});

routeradmin.post('/edit-blog-post/:postId', ensureAuthenticated, function(req, res, next) {
     coverUpload(req, res, function(err){
        if(!req.body.subject || !req.body.message ){
             sendJSONresponse(res, 400, {"message": "All the fields are required!"});
             return;
        }
        if(req.fileValidationError){
             sendJSONresponse(res, 400, {"message": req.fileValidationError});
             return;
        }
        if(!req.file){
           var updatePost = {
            author: req.user._id,
            subject : req.body.subject,
            body : req.body.message,
            modified: new Date(),
          };
        }else{
           var updatePost = {
            author: req.user._id,
            subject : req.body.subject,
            body : req.body.message,
            modified: new Date(),
            cover:  req.file.filename
          };
        }
         
     Post.update({ postId: req.params.postId}, updatePost, function(err) {
          if (err) {   return next(err); }
             sendJSONresponse(res, 200, {"message": "Post updated sucessfully"});
              return;
        });
     })
});

routeradmin.post('/remove-post/:id',  ensureAuthenticated, function(req, res, next) {
    Post.findOneAndRemove({ _id: req.params.id },function(err,post) {
         if (err) { return next(err); }
          fs.unlink("public/upload/file/"+post.cover, function(err){
            if (err && err.code == "ENOENT") {
              console.log("file doesnt exist");
            } else if(err) {
               console.log("error");
            }else{
                console.log("file removed");
            }
           });
         sendJSONresponse(res, 200, {"message": "sucessfully"});
    });
});

routeradmin.get('/courseview/:id/material', ensureAuthenticated, function(req, res, next) {
     Course.findOne({_id: req.params.id}).
          exec(function(err, course) {
          if (err) { return next(err); }
          if (!course) { return next(404); }
              Coursematerial.find({ course: req.params.id}).
                populate('course').
                exec(function(err, materials) {
                if (err) { return next(err); }
                if (!materials) { return next(404); }
                res.render('instructor/material', { 
                      materials: materials, 
                      course: course,
                      title: 'material'
                    });
              });
        });
});

routeradmin.get('/courseview/:id/assignment', ensureAuthenticated, function(req, res, next) {
     Course.findOne({_id: req.params.id}).
          exec(function(err, course) {
          if (err) { return next(err); }
          if (!course) { return next(404); }
              Coursematerial.find({ course: req.params.id}).
                populate('course').
                exec(function(err, materials) {
                if (err) { return next(err); }
                if (!materials) { return next(404); }
                res.render('instructor/assignment', { 
                      materials: materials, 
                      course: course,
                      title: 'material'
                    });
              });
        });
});

routeradmin.get('/courseview/:id/discusion', ensureAuthenticated, function(req, res, next) {
     Course.findOne({_id: req.params.id}).
          exec(function(err, course) {
          if (err) { return next(err); }
          if (!course) { return next(404); }
              Coursematerial.find({ course: req.params.id}).
                populate('course').
                exec(function(err, materials) {
                if (err) { return next(err); }
                if (!materials) { return next(404); }
                res.render('instructor/discusion', { 
                      materials: materials, 
                      course: course,
                      title: 'material'
                    });
              });
        });
});

routeradmin.get('/courseview/:id/addmaterial', ensureAuthenticated, function(req, res, next) {
     Course.findOne({_id: req.params.id}).
          exec(function(err, course) {
          if (err) { return next(err); }
          if (!course) { return next(404); }
              res.render('instructor/addmaterial', { 
                course: course,
                title: 'material'
              });
        });
});

routeradmin.get('/addcourse',  ensureAuthenticated, function(req, res, next) {
  res.render('instructor/addcourse', {
        title: 'addcourse'
    });
});

routeradmin.get('/profile',  ensureAuthenticated, function(req, res, next) {
  Tutor.findOne({ email: req.user.email }, function(err, tutor) {
    if (err) { return next(err); }
    if (!tutor) { return next(404); }
    res.render('instructor/profile', { 
      tutor: tutor, 
      title: 'profile' 
    });
  });
});

routeradmin.post('/profile',  ensureAuthenticated, function(req, res, next) {
    
    Avaterupload(req,res,function(err){
      if(req.fileValidationError){
           console.log(req.fileValidationError);
           sendJSONresponse(res, 400, {"message": req.fileValidationError});
           return;
      }
     if(req.file){
         req.user.avater = req.file.filename;
      }
      req.user.firstname = req.body.firstname;
      req.user.lastname = req.body.lastname;
      req.user.title = req.body.title;
      req.user.bio =  req.body.bio;
      req.user.save(function(err) {
        if (err) {
        next(err);
        return;
      }
       sendJSONresponse(res, 200, {"message": "Profile updated!"});
        return;
      });
    });
});

routeradmin.get('/editcourse/:id',  ensureAuthenticated, function(req, res, next) {
   Course.findOne({ _id: req.params.id }, function(err, course) {
    if (err) { return next(err); }
    if (!course) { return next(404); }
    res.render('instructor/editcourse', { 
      course: course, 
      title: 'course' 
    });
  });
});

routeradmin.post('/editcourse/:id',  ensureAuthenticated, function(req, res, next) {
    
    upload(req,res,function(err){
      if(req.fileValidationError){
           console.log(req.fileValidationError);
           sendJSONresponse(res, 400, {"message": req.fileValidationError});
           return;
      }
     if(req.file){
         var updateCourse = {
            title : req.body.title,
            department : req.body.department,
            dis: req.body.dis,
            cover : req.file.filename
          }
      }else{
          var updateCourse = {
            title : req.body.title,
            department : req.body.department,
            dis: req.body.dis,
          }
      }
      Course.update({_id: req.params.id}, updateCourse, function(err) {
        if (err) {   return next(err); }
           sendJSONresponse(res, 200, {"message": "Course updated sucessfully"});
            return;
      });
    });
});

routeradmin.post('/addcourse',  ensureAuthenticated, function(req, res, next) {
    
    upload(req,res,function(err){
      if(!req.body.title || !req.body.department || !req.body.dis || !req.body.code ){
           sendJSONresponse(res, 400, {"message": "Please fill the form"});
           return;
      }
      Course.findOne({code : req.body.code}, function(err, code){
          if(err){
            return next(err)
          }
          if(code){
            sendJSONresponse(res, 400, {"message": "The course code has already been register"});
              return;
          }
      });
      if(req.fileValidationError){
           console.log(req.fileValidationError);
           sendJSONresponse(res, 400, {"message": req.fileValidationError});
           return;
      }
       if(!req.file){
          var newCourse = new Course({
            title : req.body.title,
            code : req.body.code,
            author: req.user._id,
            department : req.body.department,
            dis: req.body.dis,
            cover : "cover.jpg"
          });
        }else{
          var newCourse = new Course({
            title : req.body.title,
            code : req.body.code,
            author: req.user._id,
            department : req.body.department,
            dis: req.body.dis,
            cover : req.file.filename
          });
        }
     newCourse.save(function(err, course){
            if (err) { 
                console.log(err);
              return next(err); 
            }else{
               console.log(req.body);
               console.log(req.file);
               sendJSONresponse(res, 200, {"message": "Course created sucessfully"});
          }
      });
    });
});



routeradmin.post('/changepassword', ensureAuthenticated,  function(req, res, next) {
   if(!req.body.cpassword || !req.body.password1 || !req.body.password2){
          sendJSONresponse(res, 400, {"message": "All the fields are required"});
          return;
        }
     Admin.findOne({ username: req.user.username }, function(err, user) {
        if (err) { return next(err); }
        if (!user) { return next(404); }
        if(user.password != req.body.cpassword){
           sendJSONresponse(res, 400, {"message": "Invalied current password"});
          return;
        }
        if(req.body.password1 != req.body.password2){
           sendJSONresponse(res, 400, {"message": "Your password and confirmation password do not match."});
          return;
        }else{
           Admin.update({username: req.user.username}, { password: req.body.password1 }, function(err) {
              if (err) {   return next(err); }
                 sendJSONresponse(res, 200, {"message": "Password changed successfully."});
                  return;
            });
        }
      });
});


routeradmin.post('/register', function(req, res, next) {
  if(!req.body.firstname || !req.body.lastname ||  !req.body.email ||  !req.body.password1 || !req.body.password2 ){
    sendJSONresponse(res, 400, {"message": "All the fields are very important"});
      return;
  }
  if(req.body.password1 != req.body.password2){
     sendJSONresponse(res, 400, {"message": "Password miss-match"});
     return;
  }else{
      var firstname = req.body.firstname;
      var lastname = req.body.lastname;
      var email = req.body.email;
      var password = req.body.password1;
            Tutor.findOne({email : email}, function(err, semail){
              if(err){
                return next(err)
              }
              if(semail){
                sendJSONresponse(res, 400, {"message": "Email address has already been register"});
                  return;
              }else{
                  var newTutor = new Tutor({
                    firstname : firstname,
                    lastname : lastname,
                    email : email,
                    password : password
                  });
                  newTutor.save(function(err, tutor){
                        if (err) { 

                            console.log(err);
                          return next(err); 
                        }else{
                        console.log('user saved');
                        console.log(tutor);
                        sendJSONresponse(res, 200, {"message": "Account created successfully"});
                      }
                  });
              }
        })
     }
});

routeradmin.get('/logout', function(req, res) {
 req.logout();
 res.redirect('/manage/admin/login');
});


module.exports = routeradmin;
