const mongoose = require("mongoose"); 


const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true,
        unique : true
    },
     email :{
        type : String,
        required : true,
        unique : true
     },
     password : {
        type : String,
        required : true
     },
     role : {
        type : String,
        enum : ["admin", "doctor", "nurse"], 
        required : true
     },

    }, 
     {timestamps : true});   


     const userModel = mongoose.model("User" , userSchema); 

     module.exports = userModel;  