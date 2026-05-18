const userModel = require("../models/user.model"); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); 

async function registerUser(req, res) {
    try {
        const { name, email, password, role } = req.body; 

        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                message: "All fields are required"
            });
        }

        const IsUserAlreadyExist = await userModel.findOne({
            $or: [
                { email: email },
                { name: name }
            ]
        });

        if (IsUserAlreadyExist) {
            return res.status(400).json({
                message: "User with this email or username already exists"  
            });
        }

        const hash = await bcrypt.hash(password, 10); 

        const newuser = await userModel.create({
            name,
            email,
            password: hash,
            role 
        });

        const token = jwt.sign({
            id: newuser._id,
            role: newuser.role 
        }, process.env.JWT_SECRET || "fallback_secret");  

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        }); 

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: newuser._id,
                name: newuser.name,
                email: newuser.email,
                role: newuser.role 
            }
        });
    } catch (error) {
        console.error("Backend Register Error:", error);
        return res.status(500).json({
            message: "Internal server error occurred during registration."
        });
    }
}


async function LoginUser(req, res){
    const {email , password} = req.body;

    if(!email || !password){
        return res.status(400).json({
            message : "All fields are required"
        }); 
    }
   
    const user = await userModel.findOne({
        $or : [
            {email}, 
            {password}
        ]
    })

    if(!user){
        return res.status(400).json({
            message : "Invalid email or password"
        });
    }

    const IfPasswordValid = await bcrypt.compare(password , user.password); 

    if(!IfPasswordValid){
        return res.status(400).json({
            message : "Invalid email or password"
        });
    } 

    const token = jwt.sign ({
        id : user._id,
        role : user.role 
    }, process.env.JWT_SECRET); 

      res.cookie("token" , token); 

      res.status(200).json({
        success : true,
        message : "User logged in successfully",
        user : {
            id : user._id,
            name : user.name,
            email : user.email,
            role : user.role 
        }
      }); 
    } 

    
    


module.exports = {
    registerUser,
    LoginUser
}; 