const mongoose = require('mongoose'),
  Schema = mongoose.Schema;
  bodyParser = require('body-parser');
  timestamps = require('mongoose-timestamp');

const messageBoardEntrySchema = new Schema({
  text:{
    type: String,
    required: true
  },
  delete_password: {
    type: String,
    required: true
  },
  replies: {
  	type : Array ,
    "default" : []
  },
  reported: {
    type : Boolean,
    "default" : false
  },
});

//activate timestamps
messageBoardEntrySchema.plugin(timestamps);

//modify names like wanted to 
mongoose.plugin(timestamps,  {
  createdAt: 'created_on',
  updatedAt: 'bumped_on'
});

// create the model
var entriesModel = mongoose.model('Entries', messageBoardEntrySchema);

// export the model
module.exports = entriesModel;
