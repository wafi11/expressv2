const express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')
const session = require('express-session')


const app = express()
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
    const findUser = await User.findOne({ email,username})
    if(findUser) {
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

    res.status(201).json({
        message : 'Succes'
    })
})

app.post("/login" ,async(req,res) => {
    const {email ,password } = req.body
    const findUser = await User.findOne({email})
    if(!findUser){
        return res.status(400).json({
            messsage : "Wrong Email "
        })
    }
    const isPassword = bcrypt.compareSync(password,findUser.password)
    if(!isPassword){
        return res.json(400).json({
            message : "Wrong Password"
        })
    }
    return res.status(200).json({
        message : "Success",
        user_data : findUser
    })
}) 




app.listen(2024, () => {
    console.log(`server running 2024`)
})