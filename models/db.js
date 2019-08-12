var mongoose = require("mongoose");
var dbURL = process.env.MONGODB_ADDON_URI || "mongodb://127.0.0.1:27017/bossworkerDB";
mongoose.connect(dbURL);

mongoose.connection.on('connected', function(){
    console.log('mongoose connected to '+ dbURL);
});
mongoose.connection.on('error', function(err){
    console.log('mongoose connection error'+ err);
});
mongoose.connection.on('disconnected', function(){
    console.log('mongoose disconnected ' );
});