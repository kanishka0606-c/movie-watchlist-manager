const mongoose = require('mongoose');

// one document per release year, used to build MV-<year>-<seq>
const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);