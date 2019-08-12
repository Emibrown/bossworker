var mongoose = require('mongoose');
var shortid = require('shortid');
mongoose.Promise = require('bluebird');

var resumeSchema = mongoose.Schema(
    {	
    	user:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        resumeId: {type: String, unique: true, 'default': shortid.generate},
    	location:{type: String, required: true},
        title:{type: String, required: true},
        Tags:[{type: String}],
        aboutMe: {type: String, required: true},
        education:[
            {
                name:{type: String, required: true},
                qualification:{type: String, required: true},
                start:{type: String, required: true},
                end:{type: String, required: true},
                note:{type: String}
            }
        ],
        experience:[
            {
                employer:{type: String, required: true},
                jobTitle:{type: String, required: true},
                start:{type: String, required: true},
                end:{type: String, required: true},
                note:{type: String}
            }
        ],
        paymentType: {type: String, required: true},
        payment: {type: Number},
        createdOn: {type: Date, default: Date.now},
        status: {type: String, default: 'Not Posted'},
        expiresOn: {type: Date},
    }
)
resumeSchema.index({
                    "status":1,
                    'title': 'text',
                    'location': 'text',
                    'Tags': 'text',
                    'aboutMe': 'text',
                },{"weights": { 
                    title: 4, 
                    location:3,
                    Tags: 2,
                    aboutMe: 1
                }}
                );
var Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;