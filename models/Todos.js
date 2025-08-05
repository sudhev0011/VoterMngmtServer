const mongoose = require('mongoose');

const todosSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    voterId: {type: mongoose.Schema.Types.ObjectId, ref: 'Voter', required: true},
    hasVoted: {type: Boolean, dafult: false}
},{timestamps: true});

module.exports = mongoose.model('Todos', todosSchema);