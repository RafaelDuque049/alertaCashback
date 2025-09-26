"use strict";

// Dependencies
const fs = require('fs');

// Modules
const { analizeData } = require('./analizeData');

// Files
const configs = JSON.parse(fs.readFileSync('./configs.json', 'utf-8'));
const response = JSON.parse(fs.readFileSync('./response.json', 'utf-8'));


exports.listener = (sessionClient) => {
    sessionClient.onMessage(async (message) => {
        if(!(process.env.MANAGERS_NUMBERS.includes(message.from) 
            || process.env.DEVELOPERS_NUMBERS.includes(message.from))
        ){
            return -1;
        }

        if (message.body.startsWith("!enviar") && message.hasOwnProperty("quotedMsgId")){
            await sessionClient.startTyping(message.from, configs.timeTyping);

            await sessionClient
                .sendText(message.from, response.requestUploadPdf, { quotedMsg: message.id })
                .then()
                .catch(err => console.log(err))

            analizeData(sessionClient, message.quotedMsgId);
        }

        if (message.body.includes("!ping")) {
            sessionClient.sendText(message.from, "!pong")
                .then(result => console.log(result))
                .catch(erro => console.log(erro))
        }
    })
}
