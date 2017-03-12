'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

const token = process.env.PAGE_ACCESS_TOKEN2

var Ibc1 = require('ibm-blockchain-js');
var ibc = new Ibc1(/*logger*/);             //you can pass a logger such as winston here - optional
var chaincode = {};
var cc_deployed = false;

var options =   {
network:{
peers:   [{
          "api_host": "2b2f68ee53fa410ea67645f54b979a45-vp2.us.blockchain.ibm.com",
          "api_port": 5003,
          "api_port_tls": 5003,
          "id": "2b2f68ee53fa410ea67645f54b979a45-vp2"
          }],
users:  [{
         "enrollId": "admin",
         "enrollSecret": "9034555c1b"
         }],
options: {                          //this is optional
quiet: true,
timeout: 60000
}
},
chaincode:{
zip_url: 'https://github.com/IBM-Blockchain/marbles/archive/master.zip',
unzip_dir: 'marbles-master/chaincode',
git_url: 'https://github.com/IBM-Blockchain/marbles'
}
};

ibc.load(options, cb_ready);

// Step 3 ==================================
function cb_ready(err, cc){                             //response has chaincode functions
    chaincode = cc;
    
    // Step 4 ==================================
    if(cc.details.deployed_name === ""){                //decide if I need to deploy or not
        cc.deploy('init', ['99'], null, cb_deployed);
        console.log('Deploying chaincode');
    }
    else{
        console.log('chaincode summary file indicates chaincode has been previously deployed');
        cb_deployed();
    }
}

function cb_deployed(err){
    console.log('sdk has deployed code and waited');
    cc_deployed = true;
    chaincode.query.read(['a']);
}

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})
/*
app.get('/chainstats/', function (req, res) {
        
        if(cc_deployed == true){
        var response;
        ibc.chain_stats(function(e, stats){
            //res.send(stats)
                        let text = JSON.stringify(event.postback)
                        sendTextMessage(sender, text.substring(0, 200), token)
                    });
        
        } else {
        res.send('Chaincode not deployed.')
        }
        
})
 */


function cb_got_index(e, index){
    if(e != null) console.log('[ws error] did not get marble index:', e);
    else{
        try{
            var json = JSON.parse(index);
            var keys = Object.keys(json);
            var concurrency = 1;
            
            //serialized version
            async.eachLimit(keys, concurrency, function(key, cb) {
                            console.log('!', json[key]);
                            chaincode.query.read([json[key]], function(e, marble) {
                                                 if(e != null) console.log('[ws error] did not get marble:', e);
                                                 else {
                                                 if(marble) sendTextMessage(sender, JSON.parse(marble), token);
                                                 cb(null);
                                                 }
                                                 });
                            }, function() {
                            sendTextMessage(sender, 'Finished', token);
                            });
        }
        catch(e){
            console.log('[ws error] could not parse response', e);
        }
    }
}

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
	if (text === 'Generic') {
                sendGenericMessage(sender)
                continue
            }
    if (text === 'Chainstats') {
         if(cc_deployed == true){
         var response;
         ibc.chain_stats(function(e, stats){
                         //res.send(stats)
                         sendTextMessage(sender, 'Block height: '+stats.height + '\n' + 'Current block hash: ' stats.currentBlockHash + '\nPrevious block hash: ' + stats.previousBlockHash  , token)
                         });
         
         } else {
         //let text = 'Chaincode not deployed.'
         sendTextMessage(sender, 'Chaincode not deployed.', token)
         }
         continue
         }
         
         if (text === 'Marbles') {
         if(cc_deployed == true){
         
         chaincode.query.read(['_marbleindex'], cb_got_index);
         
         } else {
         //let text = 'Chaincode not deployed.'
         sendTextMessage(sender, 'Chaincode not deployed.', token)
         }

         
         continue
         }
         
         
            sendTextMessage(sender, text.substring(0, 200))
        }
         if (event.postback) {
         //let text = JSON.stringify(event.postback)
         //sendTextMessage(sender, text.substring(0, 200), token)
         continue
         }
    }
    res.sendStatus(200)
})

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error1: ', response.body.error)
        }
    })
}

function sendGenericMessage(sender) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}
// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})
