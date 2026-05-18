const mongoose = require("mongoose"); 


const patientSchema = new mongoose.Schema({
    name :{
        type : String,
        required : true
     },
     age : {
        type : Number,
        required : true
     },
     disease : {
        type : String,
        required : true
     },
     admittedBy : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true
     },
     ward :{
        type : String,
        required : true
     },
     gender : {
        type : String,
        enum : ["male", "female", "other"],
        required : true
     },
    }, 
     { timestamps : true }  

     ); 
     
     const patientModel = mongoose.model("Patient", patientSchema); 

     module.exports = patientModel; 