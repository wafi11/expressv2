const cookieParser = require('cookie-parser')
const express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const session = require('express-session')

const app = express()
app.use(session({
    secret : 'token-secret-key',
    resave : false,
    saveUninitialized : true
}))
app.use(cookieParser())
app.use(express.json())
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials : true
}))
const {connnectDb} = require("../db/connection")

connnectDb().then(() => {
console.log("MongoDb connected")
})

const {User} = require('../db/user')

// Terima Request User
// Check Username udah kepake belom
// hash password User
// siman data user
app.post("/register",async (req,res) => {
    const {email,username ,password} = req.body
    const findUsername = await User.findOne({ username})
    if(findUsername) {
        return res.status(400).json({
            message : "account has ben taken"
        })
    }
    const hashedPassword = bcrypt.hashSync(password,5)
    await User.create ({
        email : email,
        username : username,
        password : hashedPassword
    })
    .then(user => console.log(user))
    .catch(err => console.log(err))

    res.status(201).json({
        message : 'Succes',
        User_data : findUsername
    })
})

app.post("/login" ,async (req,res) => {
    const {email ,password } = req.body
    const findUser = await User.findOne({email})
        if(!findUser){
            return res.status(400).json({
                messsage : "Wrong Email ",
                Login : false
            })
        }
        const isPassword = bcrypt.compareSync(password,findUser.password)
        if(!isPassword){
            return res.status(400).json({ 
                message : "wrong password",
                Login : false
            })
        }
        const accessToken = jwt.sign({email : email,password : isPassword},`jwt-access-token-secret-key`,{expiresIn : "1m"})
        const refreshToken = jwt.sign({email : email },"jwt-refresh-token-secret-key",{expiresIn : "5m"})
        res.cookie('accessToken',accessToken,{maxAge: 60000})
        res.cookie ('refreshToken',refreshToken,{maxAge :30000,httpOnly: true,secure:true,sameSite:'strict'})
        return res.json({ Login : true,message : "Success",user_data : findUser})
    
})


const verifyUser = (req,res,next) => {
    const accesstoken = req.cookies.accessToken
    console.log(accesstoken)
    if(!accesstoken){
        if(renewToken(req,res)){
            next()
        }
    }else{
        jwt.verify(accesstoken,'jwt-access-token-secret-key', (err,decoded) => {
            if(err) {
                return res.json({valid: false,message: "gagal"})
            }else{
                req.email = decoded.email
                next()
            }
    
        })
    }
}

const renewToken = async (req,res) => {
    const refreshToken = req.cookies.refreshToken
    let exist = false
    if(!refreshToken){
        return res.json({valid:false, message : "GAGAL"})
    }else{
        jwt.verify(refreshToken,'jwt-refresh-token-secret-key', (err,decoded) => {
            if(err) {
                return res.json({valid: false,message : "invalid refresh Token"})
            }else{
                const accessToken = jwt.sign({email : decoded.email},
                    "jwt-access-token-secret-key",{expiresIn : "1m"})
                res.cookie('accessToken',accessToken,{maxAge: 60000}).json({exist: true,accessToken})
            }
        })
    }
    return exist
}
app.get("/dashboard",verifyUser, async(req,res) => {
    return res.json({valid : true,message : 'Succes'})
})




app.listen(2024, () => {
    console.log(`server running 2024`)
})