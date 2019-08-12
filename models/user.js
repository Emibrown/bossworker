var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
mongoose.Promise = require('bluebird');

var userSchema = mongoose.Schema(
    {
        firstname: {type: String, required: true},
        lastname: {type: String, required: true},
        emailphone: {type: String, required: true, unique: true},
        phoneNumber: {type: String, required: true},
        password: {type: String, required: true},
        credit: {type: Number, default: 100},
        photo: {type: String, default: 'photo.png'},
        resetPasswordToken: String,
  		resetPasswordExpires: Date
    }
)

userSchema.pre('save', function(next) {
  var user = this;
  var SALT_FACTOR = 5;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

var User = mongoose.model('User', userSchema);

module.exports = User;