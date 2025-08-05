const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
    serialNo: {type: Number, required: true, unique: true},
    name: {type: String, required: true},
    guardianName: {type: String, required: true},
    houseNo: {type: String, required: true},
    houseName: {type: String, required: true},
    genderAge: {type: String, required: true},
    idCardNo: {type: String, required: true, unique: true}
}, {timestamps: true});

module.exports = mongoose.model('Voter', voterSchema)