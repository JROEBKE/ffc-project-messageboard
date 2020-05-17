/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';
//adding my controllers
const Entries = require('../controllers/entriesHandler');

//adding validator
const { check, validationResult } = require('express-validator');

//adding moment for date maninpulaiton
const Moment = require('moment');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .post([    
    check('text').trim().escape().notEmpty().withMessage('You have to provide a text'), 
    check('delete_password').trim().escape().notEmpty().withMessage('You have to provide a delete password')
  ],
    async function (req, res){

    //first get input variables
    const board = req.params.board;
    const text = req.body.text;
    const delete_password = req.body.delete_password;

    //handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: 'validation error', errors: errors.array()});
    };     
   
    await Entries.postEntry(text, delete_password, board, res);

    }
  )
  .get([
     //no options no validation
    ],
    async function (req, res){
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ message: 'validation error', errors: errors.array()});
      };

    
      const result = await Entries.getEntries()
      .then(entries => {

        //first we reduce to newest three replies
        entries.forEach(v => {           
          let replies = v.replies;          
          let repliesSorted = replies.sort((a, b)=>b.created_on.localeCompare(a.created_on));
          let reducedReplies = repliesSorted.slice(0,3);
          v.replies = reducedReplies;             
          return v;
        });

        //function to reduce reponse in replies
        function modifyReplyResponse(replies) {
          return {         
            _id: replies._id,
            text: replies.text,
            created_on: replies.created_on
          }
        } 
        
        //function to reduce response in entries aka threads
        function modifyEntriesReponse(entries) {
          let modifiedReplys = entries.replies.map(modifyReplyResponse);
          return {
            replies: modifiedReplys,            
            _id: entries._id,
            text: entries.text,
            bumped_on: entries.bumped_on,
            created_on: entries.created_on
          }
        }       
         
        return entries.map(modifyEntriesReponse);
      })
      .catch(err => console.error(err));

      return res.status(200).send(result);
    }
  )
  .delete([
    check('thread_id').trim().escape().notEmpty().matches(/^[0-9a-fA-F]{24}$/,"i").withMessage('You have to provide a valid id'),
    check('delete_password').trim().escape().notEmpty().withMessage('You have to provide delete password'), 
    ],
    async function (req, res){

      console.log('delete thread started');

      let thread_id = req.body.thread_id;
      let delete_password = req.body.delete_password;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ message: 'validation error', errors: errors.array()});
      };
      
      let searchResult = await Entries.getEntry(thread_id);
      if(!searchResult) {
        // if returned entry is empty then this id does not exist
        console.log('could not find '+thread_id);
        // BAD I have to provide 200 back to jump to alert provided by FE otherwise I would send 403
        return res.status(200).send('id not found');
      }
      else if (searchResult.delete_password==delete_password){        
        console.log('password matches');

        await Entries.deleteEntry(thread_id);
        return res.status(200).send('success');       
        
      } else {
        console.log('incorrect passwort');
        // BAD I have to provide 200 back to jump to alert provided by FE otherwise I would send 403
        return res.status(200).send('incorrect password');       
      }
    }
  )
  .put([    
    check('thread_id').trim().escape().notEmpty().matches(/^[0-9a-fA-F]{24}$/,"i").withMessage('You have to provide a valid id')
  ],
    async function (req, res){
  
      let thread_id = req.body.thread_id;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ message: 'validation error', errors: errors.array()});
      };     

      await Entries.reportEntry(thread_id, res);  
    }
  );

  app.route('/api/replies/:board')
  .post([    
    check('thread_id').trim().escape().notEmpty().matches(/^[0-9a-fA-F]{24}$/,"i").withMessage('You have to provide a valid id'),
    check('text').trim().escape().notEmpty().withMessage('You have to provide a text'), 
    check('delete_password').trim().escape().notEmpty().withMessage('You have to provide a delete password')
  ],
    async function (req, res){
      console.log(req.params.board);
    //first get input variables
    const board = req.params.board;
    console.log('board :'+board)
    const thread_id = req.body.thread_id;
    const replyText = req.body.text;
    const replyDelete_password = req.body.delete_password;

    //handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ message: 'validation error', errors: errors.array()});
    };     

    //now lets call save async function
    await Entries.replyToEntry(thread_id, replyText, replyDelete_password)
    .then(entry => {
      //console.log(entry);
      // put it here to ensure waiting before processing back
      return res.redirect(302,'/b/'+board+'/'+thread_id);      
    })
    .catch(err => console.error(err));   

    }
  )

  .get([
    check('thread_id').trim().escape().notEmpty().matches(/^[0-9a-fA-F]{24}$/,"i").withMessage('You have to provide a valid id'),
    ],
    async function (req, res){    
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ message: 'validation error', errors: errors.array()});
      };     
      
      const thread_id = req.query.thread_id;
      console.log('id is '+thread_id);
      
      let result = await Entries.getEntry(thread_id)
      .then(entry => {
        //function to reduce reponse in replies
        function modifyReplyResponse(replies) {
          return {         
            _id: replies._id,
            text: replies.text,
            created_on: replies.created_on
          }
        } 
        
        //function to reduce response in entries aka threads
        function modifyResponse(entry) {
          let modifiedReplys = entry.replies.map(modifyReplyResponse);
          return {
            replies: modifiedReplys,            
            _id: entry._id,
            text: entry.text,
            bumped_on: entry.bumped_on,
            created_on: entry.created_on
          }
        }
        let modifiedEntry = modifyResponse(entry); 
        return modifiedEntry;
      })    
      .catch(err => console.error(err));

      return res.status(200).send(result);
    }
  )

  .delete([
    check('thread_id').trim().escape().notEmpty().matches(/^[0-9a-fA-F]{24}$/,"i").withMessage('You have to provide a valid id'),
    check('reply_id').trim().escape().notEmpty().matches(/^[0-9a-fA-F]{24}$/,"i").withMessage('You have to provide a valid id'),
    check('delete_password').trim().escape().notEmpty().withMessage('You have to provide delete password'), 
    ],
    async function (req, res){
      
      console.log('delete reply started');

      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
      let delete_password = req.body.delete_password;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ message: 'validation error', errors: errors.array()});
      };
      await Entries.deleteReply(thread_id,reply_id,delete_password,res);
   
    }
  )

  .put([    
    check('thread_id').trim().escape().notEmpty().matches(/^[0-9a-fA-F]{24}$/,"i").withMessage('You have to provide a valid id'),
    check('reply_id').trim().escape().notEmpty().matches(/^[0-9a-fA-F]{24}$/,"i").withMessage('You have to provide a valid id')
  ],
    async function (req, res){
  
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ message: 'validation error', errors: errors.array()});
      };     

      await Entries.reportReply(thread_id,reply_id, res);  
    }
  );

};
