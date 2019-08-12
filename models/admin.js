var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var adminSchema = mongoose.Schema(
    {
        firstname: {type: String, required: true},
        lastname: {type: String, required: true},
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
    }
)
var Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;