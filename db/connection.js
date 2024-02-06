const mongoose = require('mongoose')

const connnectDb = () => {
    return mongoose.connect("mongodb://localhost:27017/bloganime")
}

module.exports = {
    connnectDb,
}
