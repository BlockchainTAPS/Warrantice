'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

const token = process.env.PAGE_ACCESS_TOKEN2

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

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
	if (text === 'Withdraw') {
                sendGenericMessage(sender)
                continue
            }
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
        }
         if (event.postback) {
         let text = JSON.stringify(event.postback)
         sendTextMessage(sender, text.substring(0, 200), token)
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
                    "title": "The Cabana UNIVILLAGE",
                    "subtitle": "Rating 4.5/5",
                    "image_url": "https://lh6.googleusercontent.com/-QimpAI3v_FQ/WLr9s8o5fwI/AAAAAAAADm8/LYD_u_K1JF0ltb07L9p_dyO-nD5ItyOmgCLIB/s408-k-no/",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.google.com.my/maps/place/The+Cabana+UNIVILLAGE/@2.9447181,101.8720415,17z/data=!4m12!1m6!3m5!1s0x31cdce0fd89c5829:0xca94557719d2191!2sThe+University+of+Nottingham+(Malaysia+Campus)!8m2!3d2.9452538!4d101.874713!3m4!1s0x0:0x67374158d63118e7!8m2!3d2.9433275!4d101.8725434?hl=en",
                        "title": "Location"
                    }, {
                        "type": "web_url",
                        "title": "Withdraw RM50",
                                "webview_height_ratio": "tall",
                        "url": "http://www.maybank2u.com.my/mbb_info/m2u/public/personalDetail04.do?chCatId=/mbb/Personal/CRD-Cards&programId=CRD09-MerchantProgramme&cntTypeId=0&cntKey=CRD09.01",
                    }],
                }, {
                    "title": "Nott-A-Shop",
                    "subtitle": "Rating 4.7/5",
                    "image_url": "https://scontent-kut2-1.xx.fbcdn.net/v/t1.0-9/14724604_971142202997963_5273153582612894607_n.png?oh=4338d15057dc4dbfc468e62932080ee5&oe=596ED532",
                             "buttons": [{
                                         "type": "web_url",
                                         "url": "https://www.google.com.my/maps/place/Nott+A+Shop/@2.9441378,101.8736967,17z/data=!3m1!4b1!4m5!3m4!1s0x31cdce0fc65426fb:0x97f30181d2e8d430!8m2!3d2.9441378!4d101.8758854?hl=en",
                                         "title": "Location"
                                         },{
                        "type": "web_url",
                        "title": "Withdraw RM50",
                                         "webview_height_ratio": "tall",
                        "url": "http://www.maybank2u.com.my/mbb_info/m2u/public/personalDetail04.do?chCatId=/mbb/Personal/CRD-Cards&programId=CRD09-MerchantProgramme&cntTypeId=0&cntKey=CRD09.01",
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
            console.log('Error2: ', response.body.error)
        }
    })
}

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})
