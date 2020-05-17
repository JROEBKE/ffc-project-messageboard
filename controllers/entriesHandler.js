//adding my model
const Entries = require('../models/entries');

const timestamp = require('time-stamp');
const mongoose  = require('mongoose');



module.exports = {
    getEntries: getEntries,
    postEntry: postEntry,
    deleteEntry: deleteEntry,
    replyToEntry: replyToEntry,
    reportEntry: reportEntry,
    getEntry: getEntry,
    deleteReply: deleteReply,
    reportReply: reportReply
}

function getEntries(req) {
    let limit = 10; //fixed limit due to requirment
    console.log('get entries');    
    return Entries.find()    
    .sort({bumped_on: 'descending'})
    .limit(limit);          
};

async function postEntry(text, delete_password, board, res) {     
    console.log('new post');
    const newEntry = new Entries({
      text : text,
      delete_password: delete_password,
      reported: false
    });
    await newEntry.save(function (err, entry) {
      if (err) return console.error(err);
      console.log("created entry"+entry._id);                                 
      return res.redirect(302,'/b/'+board);
    });              
    
};

function deleteEntry(id) {
  console.log('delete thread '+id);  
  return Entries.findByIdAndDelete({ _id: id });   
};


function replyToEntry(thread_id, replyText,replyDelete_password) {
    let replyId = mongoose.Types.ObjectId(); 
    console.log('reply id '+replyId);
    let replyCreationTime = timestamp.utc('YYYY-MM-DDTHH:mm:ss.msZ');
    console.log('reply time '+replyCreationTime);
    let update = {_id: replyId, text: replyText, delete_password: replyDelete_password, created_on: replyCreationTime, reported: false }

    console.log('add reply to entry');
  
    const updatedReply = Entries.findById(thread_id, function (err, entry) {
      if (err){
        console.log(err);
      } else  {   
      
      entry.replies.push(update);
      entry.save()
      return entry;
      };
    });
    return updatedReply;
};

async function reportEntry(thread_id, res) {
  console.log('report entry '+thread_id);    
  Entries.findById(thread_id, function (err, entry) {
    if (err){
      console.log(err);
    } else  {
      entry.reported = true;
      entry.save(function(err) {
        if (err)
          res.status(500).end('Something went wrong');        
        res.send('success');
        console.log(entry);
      });
    }
  });
};


function getEntry(id) {
    console.log('get entry '+id);    
    let result = Entries.findById(id);
    return result;
};

function deleteReply(thread_id,reply_id,delete_password,res) {
     
  Entries.findById(thread_id, function (err, entry) {
    if (err){
      console.log(err);
    } else  {   
      let replyIndex = entry.replies.findIndex(({_id}) => _id == reply_id);
      console.log('reply index is '+replyIndex);

      let replyDeletePassword = entry.replies[replyIndex].delete_password;
      console.log('delete password is :'+replyDeletePassword);

      if (delete_password==replyDeletePassword){
        console.log('password matches');
        entry.replies[replyIndex].text = 'deleted';

        //this was a real learning, Mongoose cannot detect if included array is modified or not
        entry.markModified('replies');
        
        entry.save(function(err) {
          if (err)
            res.status(500).end('Something went wrong');
          
          res.send('success');

        });
        
      }
      else {
        console.log('incorrect password');
        res.send('incorrect password');
      }          
    }
  })
};

async function reportReply(thread_id, reply_id, res) {
  console.log('report reply '+reply_id);    
  Entries.findById(thread_id, function (err, entry) {
    if (err){
      console.log(err);
    } else  {
      let replyIndex = entry.replies.findIndex(({_id}) => _id == reply_id);
      console.log('reply index is '+replyIndex);

      entry.replies[replyIndex].reported = true;
      entry.markModified('replies');
      entry.save(function(err) {
        if (err)
          res.status(500).end('Something went wrong');        
        res.send('success');

      });
    }
  });
};