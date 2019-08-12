var express = require('express');

var User = require('../models/user');
var Job = require('../models/job');
var Post = require('../models/post');
var Resume = require('../models/resume');
var passport = require('passport');
var moment = require('moment');
var striptags = require('striptags');
var Multer = require('multer');
var mime = require('mime-types');
var shortid = require('shortid');
var currencyFormatter = require('currency-formatter');
var nodemailer = require("nodemailer");
var async = require('async');
var crypto = require('crypto');
var sm = require('sitemap');

var fs = require('fs');


var paystack = require('paystack')(process.env.PAY_SECRET);
var secret = process.env.PAY_SECRET;


var router = express.Router();


var sitemap = sm.createSitemap ({
      hostname: 'http://www.bossworker.com',
      cacheTime: 600000,        // 600 sec - cache purge period 
      urls: [
        { url: '/user',  changefreq: 'daily', priority: 1.0 },
        { url: '/user/jobs',  changefreq: 'daily',  priority: 0.8 },
        { url: '/user/freelancers',  changefreq: 'daily',  priority: 0.8 },    // changefreq: 'weekly',  priority: 0.5 
        { url: '/user/blog',    changefreq: 'daily',  priority: 0.8  },
        { url: '/user/signup',   changefreq: 'daily',  priority: 0.8  },
        { url: '/user/login',   changefreq: 'daily',  priority: 0.8  },
      ]
    }); 

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
   next();
  } else {
    res.redirect("/user/login");
  }
};

function getUrl(req, res, next) {
    req.session.redirectUrl = req.url;
    next();
};

function Authenticated(req, res, next) {
  if (req.isAuthenticated()) {
       res.redirect('/user');
  }else {
     next();
  }
};

// Route param pre condition
router.param('postId', function(req, res, next, id) {
  Post.findOne({ postId: id }, function(err, post) {
    if (err) {return res.redirect("/user/blog") };
    if (!post) {return res.redirect("/user/blog") };
    req.post = post;
    next();
  });
});

router.param('jobId', function(req, res, next, id) {
  Job.findOne({ jobId: id }, function(err, job) {
    if (err) {return res.redirect("/user/manage-jobs") };
    if (job.user != req.user._id) {return res.redirect("/user/manage-jobs") };
    next();
  });
});

var logoStorage = Multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, 'public/upload/file')
    },
    filename: function (req, file, cb) {
        cb(null, shortid.generate()+"."+ mime.extension(file.mimetype))
    }
});



var cvStorage = Multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, 'public/upload/file')
    },
    filename: function (req, file, cb) {
        cb(null, shortid.generate()+"-"+req.user.firstname+"-"+req.user.lastname+"."+ mime.extension(file.mimetype))
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

var cvupload = Multer({ //multer settings
    storage: cvStorage,
}).single('file');

var photoStorage = Multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, 'public/upload/file')
    },
    filename: function (req, file, cb) {
        cb(null, shortid.generate()+"."+ mime.extension(file.mimetype))
    }
});
var photoupload = Multer({ //multer settings
    storage: photoStorage,
    fileFilter: function(req, file, cb){
      if(file.mimetype !== mime.lookup('jpg') && file.mimetype !== mime.lookup('png')){
        req.fileValidationError = "Only jpg,png files are allowed";
        return cb(new Error('Only jpg files are allowed'))
      }
        cb(null, true)
    }
}).single('file');

var sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

var year = new Date().getFullYear();
var range = [];
for (var i = 0; i < 30; i++) {
    range.push(year - i);
}

router.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.moment = moment;
  res.locals.striptags = striptags;
  res.locals.currencyFormatter = currencyFormatter;
  res.locals.years = range;
  next();
});


router.get('/sitemap.xml', function(req, res) {
  sitemap.toXML( function (err, xml) {
      if (err) {
        return res.status(500).end();
      }
      res.header('Content-Type', 'application/xml');
      res.send( xml );
  });
});

router.get('/', getUrl, function(req, res, next) {
  Job.find({ $or: [ {status: 'Posted'}, { accountType: 'user' } ] },{ 
    _id:0,
    jobId:1,
    jobTitle: 1,
    location: 1, 
    jobType:1,
    companyName:1,
    paymentType:1,
    payment:1,
    createdOn:1,
    logo:1
  })
    .limit(8)
    .sort({createdOn:-1}) 
    .exec(function(err, jobs) {
    if (err) { return next(err); }
    if (!jobs) { return next(404); }
      Post.find({})
      .limit(3)
      .sort({created:-1}) 
      .exec(function(err, latestposts) {
        if (err) return next(err)
         res.render('user/index', { 
           jobs: jobs, 
           latestposts: latestposts,
           pageTitle: 'home',
           title: 'BossWorker - Hire freelancers & find your best jobs in Nigeria', 
           maintitle: 'home' 
         });
      });
  });
});


router.get('/signup', function(req, res, next) {
  res.render('user/sign_up', {
        pageTitle: 'signup',
        title: 'Sign Up - Find latest jobs in Nigeria - BossWorker',
        maintitle: 'signup'
    });
});


router.get('/login',  function(req, res, next) {
  res.render('user/login', {
        pageTitle: 'login',
        title: 'Sign In - Find latest jobs in Nigeria - BossWorker',
        maintitle: 'login'
    });
});

router.get('/add-job', ensureAuthenticated, function(req, res, next) {
  res.render('user/add_job', {
        title: 'Bossworker - Add jobs',
        pageTitle: 'add-job',
        maintitle: 'employee'
    });
});

// Using Express
router.post("/pay", ensureAuthenticated, function(req, res) {
  paystack.transaction.initialize({email: req.user.emailphone, amount: req.body.amount})
  .then(function(body, error) {
    if(body){
      sendJSONresponse(res, 200, {"message": body.data.authorization_url});
      return;
    }
      sendJSONresponse(res, 200, {"message": "Something went wrong, try again"});
  });
});

// Using Express
router.post("/my/webhook", function(req, res) {
  //validate event
  var hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
  if (hash == req.headers['x-paystack-signature']) {
    // Retrieve the request's body
    var event = req.body;
    if(event.event == 'charge.success' && event.data.status == 'success'){
       User.updateOne({ emailphone: event.data.customer.email },{ $inc: { credit: event.data.amount/100 } }, function(err){
          if (err) { return next(err); }
       });
    } 
  }
  res.send(200);
});


router.get('/add-freelance', ensureAuthenticated, function(req, res, next) {
  res.render('user/add_resume', {
        title: 'Bossworker - Add freelance',
        pageTitle: 'add-freelance',
        maintitle: 'candidate'
    });
});

router.get('/applications/:id', ensureAuthenticated, function(req, res, next) {
   Job.findOne({jobId: req.params.id, user: req.user._id})
    .populate('applicant.user')
    .exec(function(err, job) {
       Job.count().exec(function(err, count) {
                if (err) return next(err)
                res.render('user/applications', {
                    job: job,
                    count: count,
                    title: 'Bossworker - Job applications',
                    pageTitle: 'applications',
                    maintitle:  'employee'
                })
            })
    });
});

router.get('/edit-job/:id', ensureAuthenticated, function(req, res, next) {
  Job.findOne({ jobId: req.params.id, user: req.user._id }, function(err, job) {
    if (err) { return next(err); }
    if (!job) { return res.redirect('/user/manage-jobs'); }
    res.render('user/edit-job', {
        job: job,
        title: 'Bossworker - Edit job',
        pageTitle: 'edit-job',
        maintitle: 'employee'
    });
  });
});

router.get('/edit-freelance/:id', ensureAuthenticated, function(req, res, next) {
  Resume.findOne({ resumeId: req.params.id, user: req.user._id }, function(err, resume) {
    if (err) { return next(err); }
    if (!resume) { returnres.redirect('/user/manage-resumes'); }
    res.render('user/edit-resume', {
        resume: resume,
        title: 'Bossworker - Edit resume',
        pageTitle: 'edit-freelance',
        maintitle: 'candidate'
    });
  });
});



 
router.get('/jobs', getUrl,  function(req, res, next) {
  var perPage = 10
  var page = req.query.page || 1;
  var search = req.query.search;
  if(req.query.search){
    Job.find(
      {$text: {$search: req.query.search},$or: [ 
      {
         "status" : {
             "$eq" : 'Posted'
         }
      },
      {
         "accountType" : {
             "$eq" : 'admin'
         }
      }
      ] },
      { score: { $meta: "textScore" } },)
      .skip((perPage * page) - perPage)
      .limit(perPage)
      .sort( { score: { $meta: "textScore" } } )
      .exec(function(err, jobs) {
         Job.count( {$text: {$search: req.query.search},$or: [ 
        {
           "status" : {
               "$eq" : 'Posted'
           }
        },
        {
           "accountType" : {
               "$eq" : 'admin'
           }
        }
      ]}).exec(function(err, count) {
                  if (err) return next(err)
                  res.render('user/browse_job', {
                      jobs: jobs,
                      search: search,
                      current: page,
                      pages: Math.ceil(count / perPage),
                      pageTitle: 'jobs',
                      title: 'Latest jobs in Nigeria',
                      maintitle: 'candidate'
                  })
              })
      });
    }else{
       Job.find({ $or: [ {status: 'Posted'}, { accountType: 'user' } ] },
        { 
        _id:0,
        jobId:1,
        jobTitle: 1,
        aboutJob: 1,
        location: 1, 
        jobType:1,
        companyName:1,
        paymentType:1,
        payment:1,
        createdOn:1,
        logo:1
      },)
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .sort({createdOn:-1}) 
    .populate('user')
    .exec(function(err, jobs) {
       Job.count({status: 'Posted'}).exec(function(err, count) {
                if (err) return next(err)
                res.render('user/browse_job', {
                    jobs: jobs,
                    search: search,
                    current: page,
                    pages: Math.ceil(count / perPage),
                    pageTitle: 'jobs',
                    title: 'Latest jobs in Nigeria',
                    maintitle: 'candidate'
                })
            })
    });
    }
});

router.get('/freelancers', getUrl,  function(req, res, next) {
  var perPage = 10
  var page = req.query.page || 1;
  var search = req.query.search;
  if(req.query.search){
     Resume.find({$text: {$search: req.query.search},status: 'Posted'},
     { score: { $meta: "textScore" } })
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .populate('user')
    .sort( { score: { $meta: "textScore" } } )
    .exec(function(err, resumes) {
       Resume.count({$text: {$search: req.query.search},status: 'Posted'}).exec(function(err, count) {
                if (err) return next(err)
                res.render('user/browse-resume', {
                    resumes: resumes,
                    search: search,
                    current: page,
                    pages: Math.ceil(count / perPage),
                    pageTitle: 'freelancers',
                    title: 'Best freelancers in Nigeria for hire - BossWorker',
                    maintitle: 'employee'
                })
            })
    });
  }else{
    Resume.find({status: 'Posted'},
        { 
        _id:0,
        resumeId:1,
        title:1,
        location: 1, 
        aboutMe:1,
        paymentType:1,
        payment:1,
        createdOn:1,
        user:1,
        Tags:1
      },)
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .sort({createdOn:-1}) 
    .populate('user')
    .exec(function(err, resumes) {
       Resume.count({status: 'Posted'}).exec(function(err, count) {
                if (err) return next(err)
                res.render('user/browse-resume', {
                    resumes: resumes,
                    search: search,
                    current: page,
                    pages: Math.ceil(count / perPage),
                    pageTitle: 'freelancers',
                    title: 'Best freelancers in Nigeria for hire - BossWorker',
                    maintitle: 'employee'
                })
            })
    });
  }
});

router.get('/blog', function(req, res, next) {
  var perPage = 4;
  var page = req.query.page || 1;
  var search = req.query.search;
  if(req.query.search){
    Post.find({$text: {$search: req.query.search}},
     { score: { $meta: "textScore" } })
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .sort( { score: { $meta: "textScore" } } )
    .exec(function(err, posts) {
       Post.count({$text: {$search: req.query.search}}).exec(function(err, count) {
                if (err) return next(err)
                Post.find({})
                .limit(3)
                .sort({created:-1}) 
                .exec(function(err, latestposts) {
                  if (err) return next(err)
                   res.render('user/blog', {
                        posts: posts,
                        latestposts: latestposts,
                        count:count,
                        search: search,
                        current: page,
                        pageTitle: 'blog',
                        pages: Math.ceil(count / perPage),
                        title: 'Blog - Latest job news in Nigeria - BossWorker', 
                        maintitle: 'blog'
                    })
                });
            })
    });
  }else{
    Post.find({},
     { 
        _id:0,
        postId:1,
        comments: 1, 
        body:1,
        cover:1,
        subject:1,
        created:1,
      },)
    .skip((perPage * page) - perPage)
    .limit(perPage)
    .sort({created:-1}) 
    .exec(function(err, posts) {
       Post.count().exec(function(err, count) {
                if (err) return next(err)
                Post.find({})
                .limit(3)
                .sort({created:-1}) 
                .exec(function(err, latestposts) {
                  if (err) return next(err)
                   res.render('user/blog', {
                        posts: posts,
                        latestposts: latestposts,
                         count:count,
                        search: search,
                        current: page,
                        pages: Math.ceil(count / perPage),
                        pageTitle: 'blog',
                        title: 'Blog - Latest job news in Nigeria - BossWorker', 
                        maintitle: 'blog'
                    })
                });
            })
    });
  }
});


router.get('/jobs/:id/:title', getUrl,  function(req, res, next) {
  Job.findOne({jobId : req.params.id, status: 'Posted'}).
    exec(function(err, job) {
    if (err) { return next(err); }
    if (!job) { return res.redirect('/user/jobs'); }
    if (job.jobTitle.replace(/ /g, '-') != req.params.title) { return res.redirect('/user/jobs'); }
    res.render('user/job_view', { 
      job: job, 
      pageTitle: 'job',
      title: job.jobTitle+" at "+job.companyName+", "+job.location+" - Jobs in Nigeria",
      maintitle: 'candidate' 
    });
  });
});

router.post('/applyjob/:id', ensureAuthenticated,  function(req, res, next) {
    cvupload(req,res,function(err){
      var found = false;
       if(!req.body.message ){
             sendJSONresponse(res, 400, {"message": "Message is required"});
             return;
        }
        var str = JSON.stringify(req.user._id);
       
        Job.findOne({_id : req.params.id}).
          exec(function(err, job) {
          if (err) { return next(err); }
          if (!job) { return next(err); }
          if (JSON.stringify(job.user) == JSON.stringify(req.user._id) ) { 
            return;
          }
          for(var i = 0; i < job.applicant.length; i++) {
              if (JSON.stringify(job.applicant[i].user) == JSON.stringify(req.user._id)) {
                 found = true;
                 break;
              }
          }
          if(!found){
            if(req.file){
               var applicant = {
                user:req.user._id, 
                message: req.body.message,
                cv: req.file.filename
              }
            }else{
              var applicant = {
                user:req.user._id, 
                message: req.body.message
              }
            }
             Job.update({_id: req.params.id},{ $push:{  applicant: applicant } }, function(err) {
                if (err) {   return next(err); }
                   sendJSONresponse(res, 200, {"message": "Application sent successfully."});
                    return;
              });
          }else{
            if(req.file){
               fs.unlink("public/upload/file/"+req.file.filename, function(err){
                if (err && err.code == "ENOENT") {
                } else if(err) {
                }else{
                }
               });
                sendJSONresponse(res, 400, {"message": "You already apply for this job."});
            }
          }
        });
    });
});

router.get('/freelancers/:Id', getUrl,  function(req, res, next) {
  Resume.findOne({resumeId : req.params.Id, status: 'Posted'})
    .populate('user')
    .exec(function(err, resume) {
    if (err) { return next(err); }
    if (!resume) { return res.redirect('/user/freelancers'); }
    res.render('user/resume-view', {
       resume: resume, 
       pageTitle: 'employee',
       title: resume.user.firstname+" "+resume.user.lastname+" - "+resume.title+" - Bossworker freelancer from "+resume.location+" - Freelancers in Nigeria",  
       maintitle: 'employee'
      });
  });
});


// Blog Post


router.get('/profile',  ensureAuthenticated, function(req, res, next) {
  User.findOne({ _id: req.user._id }, function(err, user) {
    if (err) { return next(err); }
    if (!user) { return next(404); }
    res.render('user/profile', { 
      user: user, 
      title: 'Bossworker - User profile',
      pageTitle: 'profile',
      maintitle: 'profile'
    });
  });
});

router.post('/profile',  ensureAuthenticated, function(req, res, next) {
     photoupload(req,res,function(err){
        if(req.fileValidationError){
             sendJSONresponse(res, 400, {"message": req.fileValidationError});
             return;
        }
       if(!req.file){
          var updateUser = {
            firstname: req.body.firstName,
            lastname : req.body.lastName,
            phoneNumber : req.body.phone,
          }
        }else{
          User.findOne({ _id: req.user._id },function(err,user) {
               if (err) { return next(err); }
               if(user.photo != "photo.png"){
                  fs.unlink("public/upload/file/"+user.photo, function(err){
                    if (err && err.code == "ENOENT") {
                    } else if(err) {
                    }else{
                    }
                   });
               }
          });
          var updateUser  = {
            firstname: req.body.firstName,
            lastname : req.body.lastName,
            phoneNumber : req.body.phone,
            photo:  req.file.filename
          }
        }
        User.update({_id: req.user._id}, updateUser, function(err) {
          if (err) {   return next(err); }
             sendJSONresponse(res, 200, {"message": "User updated sucessfully"});
              return;
        });
     })
});

router.get('/blog/:postId',  function(req, res, next) {
  Post.find({})
  .limit(3)
  .sort({created:-1}) 
  .exec(function(err, latestposts) {
    if (err) return next(err)
     res.render('user/post-details', {
          latestposts: latestposts,
          title: req.post.subject+" - Bossworker",
          maintitle: 'blog',
          pageTitle: 'post',
          post: req.post
      })
  });
});

// Add comment
router.post('/post/comment/:id', function(req, res, next) {
     console.log(req.body);
   if(!req.body.name || !req.body.body ){
      console.log('error');
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

router.post('/editjob/:jobId', ensureAuthenticated, function(req, res, next) {
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
            user: req.user._id,
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
            user: req.user._id,
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
        Job.update({_id: req.params.jobId}, updateJob, function(err) {
          if (err) {   return next(err); }
             sendJSONresponse(res, 200, {"message": "Job updated sucessfully"});
              return;
        });
     })
    
});

router.post('/editresume/:id', ensureAuthenticated, function(req, res, next) {
        if(!req.body.title || !req.body.location || !req.body.aboutMe || !req.body.tags  || !req.body.paymentType  ){
             sendJSONresponse(res, 400, {"message": "Please fill all the field without Optional (OPTIONAL) currectly"});
             return;
        }
          var updateResume = {
            location : req.body.location,
            title: req.body.title,
            aboutMe: req.body.aboutMe,
            Tags: req.body.tags,
            paymentType: req.body.paymentType,
            payment: req.body.payment,
            education: req.body.educations,
            experience: req.body.experiences,
          }
        Resume.update({_id: req.params.id}, updateResume, function(err) {
          if (err) {  return next(err); }
             sendJSONresponse(res, 200, {"message": "Resume updated sucessfully"});
              return;
        });
});

router.post('/removejob/:id',  ensureAuthenticated, function(req, res, next) {
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
         sitemap.del({ url: '/user/jobs/'+job.jobId+'/'+job.jobTitle.replace(/ /g, '-'),  changefreq: 'daily', priority: 0.7 })
         sendJSONresponse(res, 200, {"message": "sucessfully"});
    });
});

router.post('/removeresume/:id',  ensureAuthenticated, function(req, res, next) {
    Resume.findOneAndRemove({ _id: req.params.id },function(err,resume) {
         if (err) { return next(err); }
         if(resume.photo != "photo.png"){
            fs.unlink("public/upload/file/"+resume.photo, function(err){
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


router.post('/addjob', ensureAuthenticated, function(req, res, next) {
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
            user: req.user._id,
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
            logo: "cover.png"
          });
        }else{
          var newjob = new Job({
            user: req.user._id,
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

router.post('/add-resume', ensureAuthenticated, function(req, res, next) {
        if(!req.body.title || !req.body.location || !req.body.aboutMe || !req.body.tags  || !req.body.paymentType  ){
             sendJSONresponse(res, 400, {"message": "Please fill all the field without Optional (OPTIONAL) currectly"});
             return;
        }
           var newResume = new Resume();
            newResume.user = req.user._id;
            newResume.location = req.body.location;
            newResume.title = req.body.title;
            newResume.aboutMe = req.body.aboutMe;
            newResume.paymentType = req.body.paymentType;
            newResume.payment = req.body.payment;
            newResume.Tags = req.body.tags;
            newResume.education= req.body.educations;
            newResume.experience = req.body.experiences;

         newResume.save(function(err, resume){
                if (err) { 
                    console.log(err);
                  return next(err); 
                }else{
                   console.log(resume);
                   sendJSONresponse(res, 200, {"message": "Resume posted sucessfully","resumeId": resume._id});
              }
          });
});


router.post('/post-job/:id/:price', ensureAuthenticated, function(req, res, next){
  if (!req.params.id || !req.params.price*100) {
    return next(err); 
  }
  if (req.params.price*100 > req.user.credit) {
     return sendJSONresponse(res, 400, {"message": "Get more credit"});
  }else{
     User.update({ _id: req.user._id },{ credit: req.user.credit - req.params.price*100}, function(err){
        if (err) { return next(err); }
        Job.findOneAndUpdate({ _id: req.params.id },{ expiresOn: moment().add(604800*req.params.price, 'seconds'), status: "Posted", createdOn: moment()}, function(err, job){
            if (err) { return next(err); }
            sitemap.add({ url: '/user/jobs/'+job.jobId+'/'+job.jobTitle.replace(/ /g, '-'),  changefreq: 'daily', priority: 0.7 })
            sendJSONresponse(res, 200, {"message": "Job posted successfully"});
          });
      });
  }
});


router.post('/post-resume/:id/:price', ensureAuthenticated, function(req, res, next){
  if (!req.params.id || !req.params.price) {
    return next(err); 
  }
  if (req.params.price*100 > req.user.credit) {
     return sendJSONresponse(res, 400, {"message": "Get more credit"});
  }else{
     User.update({ _id: req.user._id },{ credit: req.user.credit - req.params.price*100}, function(err){
        if (err) {  return next(err); }
        Resume.findOneAndUpdate({ _id: req.params.id },{ expiresOn: moment().add(604800*req.params.price, 'seconds'), status: "Posted", createdOn: moment()}, function(err){
            if (err) {   return next(err); }
            sitemap.add({ url: '/user/freelancers/'+resumeId,  changefreq: 'daily', priority: 0.7 })
            sendJSONresponse(res, 200, {"message": "Resume posted successfully"});
          });
      });
  }
});


router.get('/manage-jobs', ensureAuthenticated, function(req, res, next) {
   Job.find({user: req.user._id})
    .sort({createdOn:-1}) 
    .exec(function(err, jobs) {
    if (err) { return next(err); }
    if (!jobs) { return next(404); }
    res.render('user/manage-jobs', { 
      jobs: jobs, 
      title: 'Bossworker Manage Jobs',  
      pageTitle: 'manage-jobs',
      maintitle: 'employee' 
    });
  });
});

router.get('/manage-freelance', ensureAuthenticated, function(req, res, next) {
   Resume.find({user: req.user._id})
    .sort({createdOn:-1}) 
    .exec(function(err, resumes) {
    if (err) { return next(err); }
    if (!resumes) { return next(404); }
    res.render('user/manage-resumes', {
     resumes: resumes, 
     title: 'Bossworker - Manage Freelance', 
     pageTitle: 'manage-freelance',
     maintitle: 'candidate' 
   });
  });
});




router.post('/forget',  function(req, res, next) {
   async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ emailphone: req.body.email }, function(err, user) {
        if (!user) {
          sendJSONresponse(res, 400, {"message": 'No account with that email address exists.'});
          return ;
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport  = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: 'bossworker51@gmail.com',
              pass: 'Bossworker2017'
          }
      });
      var mailOptions = {
        to: user.emailphone,
        from: 'Bossworker',
        subject: 'Bossworker Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/user/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        sendJSONresponse(res, 200, {"message": 'An e-mail has been sent to ' + user.emailphone + ' with further instructions.'});
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
       res.render('user/passError', {
          title: "bossworker - Password Reset",
          message: "Password reset token is invalid or has expired."
        });
       return;
    }
    res.render('user/reset', {
      token: req.params.token,
      title: "bossworker - Password Reset",
      pageTitle: 'reset',
      maintitle: "reset"
    });
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          sendJSONresponse(res, 400, {"message": 'Password reset token is invalid or has expired.'});
          return ;
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
             if (err) { return next(err); }
              sendJSONresponse(res, 200, {"message": "Login successfull please wait..."});
          });
        });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
           user: 'bossworker51@gmail.com',
           pass: 'Bossworker2017'
        }
      });
      var mailOptions = {
        to: user.emailphone,
        from: 'Bossworker',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + uuser.emailphone + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        sendJSONresponse(res, 200, {"message": 'Success! Your password has been changed.'});
        done(err);
      });
    }
  ], function(err) {
  });
});

router.post('/changePassword', ensureAuthenticated,  function(req, res, next) {
   if(!req.body.old || !req.body.new || !req.body.repeat){
          sendJSONresponse(res, 400, {"message": "All the fields are required"});
          return;
        }
     User.findOne({ _id: req.user._id }, function(err, user) {
        if (err) { return next(err); }
        if (!user) { return next(404); }
        if(user.password != req.body.old){
           sendJSONresponse(res, 400, {"message": "Invalied current password"});
          return;
        }
         User.update({_id: req.user._id}, { password: req.body.new }, function(err) {
            if (err) {   return next(err); }
               sendJSONresponse(res, 200, {"message": "Password changed successfully."});
                return;
          });
      });
});

router.get('/logout', function(req, res) {
 req.logout();
 res.redirect('/user/login');
});


router.post('/register', function(req, res, next) {
  if(!req.body.firstname || !req.body.lastname || !req.body.emailphone ||  !req.body.password1 ){
    sendJSONresponse(res, 400, {"message": "All the fields are very important"});
      return;
  }else{
      var firstname = req.body.firstname;
      var lastname = req.body.lastname;
      var emailphone = req.body.emailphone;
      var phoneNumber = req.body.phone;
      var password = req.body.password1;
      User.findOne({emailphone : emailphone}, function(err, user){
          if(err){
            return next(err);
          }
          if(user){
             sendJSONresponse(res, 400, { "message":"Email has already been registered"});
            return;
          }else{
                var newUser = new User({
                  firstname : firstname,
                  lastname : lastname,
                  emailphone : emailphone,
                  phoneNumber : phoneNumber,
                  password : password
                });
                newUser.save(function(err){
                      if (err) { 
                        return next(err); 
                      }else{
                      sendJSONresponse(res, 200, {"firstname": newUser.firstname, 'lastname': newUser.lastname});
                    }
                });
              }
        });
     }
});

router.post('/login', function(req, res, next) {
      var redirectUrl = '';
      passport.authenticate('user-local', function(err, user, info) {
       if(!req.body.password || !req.body.emailphone){
         sendJSONresponse(res, 400, {"message": "Enter your username and password"});
          return;
        }
       if (err) { return next(err); }
       if (!user) { 
          sendJSONresponse(res, 400, {"message": "Invalied login credentials"});
          return;
        }
        if (req.session.redirectUrl) {
          redirectUrl = req.session.redirectUrl;
          req.session.redirectUrl = null;
        }
        req.logIn(user, function(err) {
          if (err) { return next(err); }
            sendJSONresponse(res, 200, {"message": "Login successfull please wait...", redirectUrl :redirectUrl});
            return;
       });
    })(req, res, next);
    });

module.exports = router;
