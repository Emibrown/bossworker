var mongoose = require('mongoose');
var shortid = require('shortid');
mongoose.Promise = require('bluebird');

var jobSchema = mongoose.Schema(
    {	
    	user:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        jobId: {type: String, unique: true, 'default': shortid.generate},
        jobTitle:{type: String, required: true},
    	location:{type: String, required: true},
    	jobType:{type: String, required: true},	
    	category:[{type: String, required: true}],
        aboutJob: {type: String, required: true},
        paymentType: {type: String, required: true},
        payment: {type: String},
		companyName:{type: String, required: true},
		website:{type: String},
        email:{type: String},
        phone:{type: String},
        address: {type: String},
		logo:{type: String},
        applicant:[
            {
                user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
                message:{type: String, required: true},
                cv:{type: String},
                createdOn: {type: Date, default: Date.now},
            }
        ],
        createdOn: {type: Date, default: Date.now},
        status: {type: String, default: 'Not Posted'},
        accountType: {type: String, default: 'user'},
        expiresOn: {type: Date},
    }
)
jobSchema.index({
                    'jobTitle': 'text',
                    'location': 'text',
                    'aboutJob': 'text',
                    'jobType': 'text',
                    'category': 'text',
                    'companyName': 'text'
                },{"weights": { 
                    jobTitle: 4, 
                    location:3,
                    companyName:3
                }}
                );
jobSchema.index({status: 1, accountType: 1});
var Job = mongoose.model('Job', jobSchema);

module.exports = Job;