'use strict';

// Dependencies
const pdfParse = require('pdf-parse');
const fs = require('fs');

// Modules
const { repetName, convertRealToNumber, compareBonusAlreadySent, inWhatsApp, getRegisteredBonuses } = require('./tools');
const { sendCashbacks } = require('./sendCashbacks');

// Files
const response = JSON.parse(fs.readFileSync('./response.json'));


/**
 * It receives the client's session class and the message ID of the file to be downloaded as parameters.
 * After downloading, it extracts the files and organizes them into a list of client objects.
 * @param {class} sessionClient Client class 
 * @param {string} messageQuoted  Message Id
 */
exports.analizeData = async (sessionClient, messageQuoted) => {
    let dataClients = [];

    let buffer = await sessionClient.downloadMedia(messageQuoted)
        .catch(err => console.log(err))

    const dataBuffer = Buffer.from(buffer.replace("data:application/pdf;base64,", ''), "base64");

    pdfParse(dataBuffer)
        .then(dataCashback => {
            const dataTBFG = [...dataCashback.text.matchAll(/(\d{2}\/\d{2}\/\d{4})([A-Za-zÀ-ÿ\s]+)\((\d{2})\)\s?(\d{4,5}-\d{4})R\$ ([\d\.]+,\d{2})R\$ ([\d\.]+,\d{2})(\d{2}\/\d{2}\/\d{4})/g)];
                    
            for (let line of dataTBFG){
                dataClients.push({
                    "name": repetName(line[2]),
                    "telephone": line[3].concat(line[4]).replace('-', ''),
                    "purchaseValue": line[5],
                    "datePurchase": line[1],
                    "bonus": line[6],
                    "expiryDate": line[7],
                    "processSendBonus": null,
                    "reasonForNotSending": null,
                })
            }

            filterData(sessionClient, dataClients);
        })
        .catch(err => console.log(err));
}


/**
 * Removes bonuses before the last one generated, and filters values ​​smaller than those defined in the configuration file.
 * @param {list} dataObject Customer list (unfiltered)
 */
async function filterData(sessionClient, dataObject){
    const configs = JSON.parse(fs.readFileSync('./configs.json', 'utf-8'));
    
    let filteredClients = {}; 
    
    let registeredBonuses = getRegisteredBonuses();

    console.time("performance")

    for(let dataClient of dataObject){
        if (convertRealToNumber(dataClient.bonus) < configs.minimumValue){
            dataClient.processSendBonus = false;
            dataClient.reasonForNotSending = response.minimumValue;
        }
        
        else if(compareBonusAlreadySent(dataClient, registeredBonuses)){
            dataClient.processSendBonus = false;
            dataClient.reasonForNotSending = response.previouslySent;
        }

        else if(await inWhatsApp(sessionClient, dataClient.telephone) == false){
            dataClient.processSendBonus = false;
            dataClient.reasonForNotSending = response.inconsistentPhoneNumber;
        } 
        
        else {
            dataClient.processSendBonus = true;
            dataClient.reasonForNotSending = response.inAccordance;
        }

        filteredClients[dataClient.telephone] = dataClient;
    }

    console.timeEnd("performance")

    sendCashbacks(sessionClient, filteredClients, registeredBonuses)
}
