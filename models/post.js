var mongoose = require('mongoose');
var shortid = require('shortid');
mongoose.Promise = require('bluebird');

var postSchema = mongoose.Schema(
    {
    	subject: {type: String, required: true},
    	postId: {type: String, unique: true, 'default': shortid.generate},
		body:  {type: String, required: true},
		created: {type: Date, default: Date.now},
		modified: {type: Date},
		author: {type: mongoose.Schema.Types.ObjectId, ref: 'Admin'},
		comments: [
			{
				name: {type: String, required: true},
				body: {type: String, required: true},
				created: {type: Date, default: Date.now}
			}
		],
		cover:{type: String}
    }
)

postSchema.index({
                    'subject': 'text',
                    'body': 'text'
                },{"weights": { 
                    subject: 2, 
                    body:1
                }}
                );
var Post = mongoose.model('Post', postSchema);

module.exports = Post;