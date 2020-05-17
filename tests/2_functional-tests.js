/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var should = chai.should();
var server = require('../server');

chai.use(chaiHttp);
chai.use(require('chai-datetime'));

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Test POST /api/threads/:board success', function(done) {
        chai.request(server)
        .post('/api/threads/test')
        .send({
          text: 'Lore ipsum sum',
          delete_password: 'magic'          
        })
        .end(function(err, res){
          
          res.should.have.status(200);   
          res.request.url.should.be.a('string');
          res.request.url.should.include('/b/test');

          done();         
        });
      });
      test('POST Create test data', function(done) {
        chai.request(server)
        .post('/api/threads/test')
        .send({
          text: 'Lore ipsum sum',
          delete_password: 'magic'          
        })
        .end(function(err, res){
          
          res.should.have.status(200);   
          res.request.url.should.be.a('string');
          res.request.url.should.include('/b/test');

          done();         
        });
      });   
    });
    
    
    suite('GET', function() {

      test('check security headers', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .query({})
        .end(function(err, res){
          console.log(err);         
          //test if content security headers is correctly set: Only allow your site to be loading in an iFrame on your own pages.
          res.should.have.header('X-Frame-Options', 'SAMEORIGIN');
          //test if content security headers is correctly set:Do not allow DNS prefetching
          res.should.have.header('X-DNS-Prefetch-Control', 'off');
          //test if content security headers is correctly set:Do not allow DNS prefetching
          res.should.have.header('Referrer-Policy', 'same-origin');                 
          done();
        });        
      });   

      test('list recent threads', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .query({})
        .end(function(err, res){
          console.log(err);       
          res.should.have.status(200);
          res.should.be.json;                   
          res.body.should.be.a('array');          
          res.body[0].should.have.property('bumped_on');      
          res.body[1].should.have.property('bumped_on');
          let time1 = new Date(res.body[0].bumped_on);
          let time2 = new Date(res.body[1].bumped_on);
          time1.should.be.afterTime(time2);
          done();
        });        
      });    
      test('list recent 10 threads with only the most recent 3 replies from /api/threads/{board}. The reported and delete_passwords fields will not be sent', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .query({})
        .end(function(err, res){
          console.log(err);       
          res.should.have.status(200);
          res.should.be.json;                   
          res.body.should.be.a('array');
          console.log('body length is: '+res.body.length);
          res.body.length.should.be.below(11);
          res.body[0].should.have.property('text').eql('Lore ipsum sum');
          res.body[0].should.not.have.property('reported');
          res.body[0].should.not.have.property('delete_password');
          console.log('reply length is: '+res.body[2].replies.length);
          //THIS requires one run through in empty database
          res.body[2].replies.length.should.be.below(4);
          //compare timestamps of replies
          res.body[2].replies[0].should.have.property('created_on');      
          res.body[2].replies[1].should.have.property('created_on');
          let time1 = new Date(res.body[2].replies[0].created_on);
          let time2 = new Date(res.body[2].replies[1].created_on);
          time1.should.be.afterTime(time2);
          //check deleted fields are not sent
          res.body[2].replies[0].should.not.have.property('delete_password');
          res.body[2].replies[0].should.not.have.property('reported');
          done();
        });        
      });         
    });
    
    suite('DELETE', function() {
      
      test('delete an entire thread wrong password', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .query({})
        .end(function(err, res){          
          console.log('we delete this id: '+res.body[0]._id);
          chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: res.body[0]._id,
            delete_password: 'no magic'          
          })
          .end(function(err, res){
            res.should.have.status(200);
            res.text.should.be.equal('incorrect password');
          done();
          });        
        });        
      });
      
      test('delete an entire thread with correct password', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .query({})
        .end(function(err, res){          
          console.log('we delete this id: '+res.body[0]._id);
          chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: res.body[0]._id,
            delete_password: 'magic'          
          })
          .end(function(err, res){
            res.should.have.status(200);
            res.text.should.be.equal('success');
          done();
          });        
        });        
      });   
    });
    
    suite('PUT', function() {
      test('report a reply', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .query({})
        .end(function(err, res){          
          console.log('we report this thread: '+res.body[0]._id);
          chai.request(server)
          .put('/api/threads/test')
          .send({
            thread_id: res.body[0]._id
          })
          .end(function(err, res){
            res.should.have.status(200);
            res.text.should.be.equal('success');
          done();
          });        
        });        
      });
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      
      test('Test add reply POST /api/threads/:board success', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .query({})
        .end(function(err, res){          
          console.log(res.body[0]._id);
          const id = res.body[0]._id;
          chai.request(server)
          .post('/api/replies/test')
          .send({
            thread_id: id,
            text: 'Reply0',
            delete_password: '0'          
          })
          .end(function(err, res){
            console.log(err);
            res.should.have.status(200);   
            res.request.url.should.be.a('string');
            res.request.url.should.include('/b/test/'+id);
            
            //Now we have to add some more replies to allow get to work ugly but it has to be done
            chai.request(server)
            .post('/api/replies/test')
            .send({
              thread_id: id,
              text: 'Reply1',
              delete_password: 'magic'         
            })
            .end(function(err, res){
              console.log(err);
              chai.request(server)
              .post('/api/replies/test')
              .send({
                thread_id: id,
                text: 'Reply2',
                delete_password: 'magic'         
              })
              .end(function(err, res){
                console.log(err);
                chai.request(server)
                .post('/api/replies/test')
                .send({
                  thread_id: id,
                  text: 'Reply3',
                  delete_password: 'magic'          
                })
                .end(function(err, res){
                  done();                  
                });
              });
            });

          });
        });
      });
      
    });
    
    suite('GET', function() {
      test('Test GET an entire thread with all its replies from /api/replies/{board}?thread_id={thread_id} success', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .query({})
        .end(function(err, res){          
          console.log(res.body[0]._id);
          const id = res.body[0]._id;
          chai.request(server)
          .get('/api/replies/test?thread_id='+id)
          .end(function(err, res){
            res.should.have.status(200);
            res.body.should.have.property('text').eql('Lore ipsum sum');
            res.body.should.not.have.property('reported');
            res.body.should.not.have.property('delete_password');
            res.body.should.have.property('bumped_on');
            res.body.should.have.property('created_on');
            res.body.replies.length.should.be.above(3);
            done();
          });
        });
      });
    });
    
    suite('PUT', function() {
      test('report a reply', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .query({})
        .end(function(err, res){          
          console.log('we report this reply: '+res.body[0].replies[0]._id);
          chai.request(server)
          .put('/api/replies/test')
          .send({
            thread_id: res.body[0]._id,
            reply_id: res.body[0].replies[0]._id, 
          })
          .end(function(err, res){
            res.should.have.status(200);
            res.text.should.be.equal('success');
          done();
          });        
        });        
      });
    });
    
    suite('DELETE', function() {
      test('delete a reply with wrong password', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .query({})
        .end(function(err, res){          
          console.log('we delete this reply: '+res.body[0].replies[0]._id);
          chai.request(server)
          .delete('/api/replies/test')
          .send({
            thread_id: res.body[0]._id,
            reply_id: res.body[0].replies[0]._id,
            delete_password: 'no magic',          
          })
          .end(function(err, res){
            res.should.have.status(200);
            res.text.should.be.equal('incorrect password');
          done();
          });        
        });        
      });
      
      test('delete a reply with correct password', function(done) {
        chai.request(server)
        .get('/api/threads/test')
        .query({})
        .end(function(err, res){
          console.log(res.body[0].replies[0]);
          console.log('we delete this reply: '+res.body[0].replies[0]._id);           
          chai.request(server)
          .delete('/api/replies/test')
          .send({
            thread_id: res.body[0]._id,
            reply_id: res.body[0].replies[0]._id,
            delete_password: 'magic'         
          })
          .end(function(err, res){
            res.should.have.status(200);
            res.text.should.be.equal('success');
          done();
          });        
        });        
      });   
    });
    
  });
  
});
