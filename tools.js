"use strict";

// Dependencies
const fs = require('fs');

// Files
const configs = JSON.parse(fs.readFileSync('./configs.json', 'utf-8'));
const response = JSON.parse(fs.readFileSync('./response.json', 'utf-8'));



exports.convertRealToNumber = (real) => {
    return Number(real.replace(",", "."));
};


/**
 * 
 * @param {string} name 
 * @returns {string}
 */
exports.repetName = (name) => {
    let nameInput = name.split(" ")

    return nameInput.length == 2 && nameInput[0] == nameInput[1]
        ? nameInput[0]
        : nameInput.join(" ");
}


/**
 * Checks if the bonus was previously triggered. If it was sent previously, it returns the value True;
 * @param {object} clientObject Object representing the customer who will receive the bonus;
 * @param {object} registredBonusesFile List of objects containing records of bonuses already sent;
 * @returns {boolean} returns true if it has already been sent, and false if it has not been sent.
 */
exports.compareBonusAlreadySent = (clientObject, registredBonusesFile) => {
    if(registredBonusesFile.hasOwnProperty(clientObject.telephone)){
        if(
            registredBonusesFile[clientObject.telephone].bonus == clientObject.bonus 
            && registredBonusesFile[clientObject.telephone].datePurchase == clientObject.datePurchase
            && registredBonusesFile[clientObject.telephone].reasonForNotSending != response.sendingFailure
        ){
            return true;
        }
    }

    return false;
}


/**
 * Check if the number provided exists on WhatsApp (Functional only for Brazil);
 * @param {string} telephone receive the cellphone number;
 * @param {object} sessionClient receive the client session object;
 * @returns {boolean} return the true value, if the client doesn't exist in WhatsApp;
 */
exports.inWhatsApp = (sessionClient, telephone) => {
    return new Promise(async (resolve, rejects) => {
        await sessionClient
                    .checkNumberStatus(`55${telephone}@c.us`)
                    .then(result => resolve(result.numberExists))
                    .catch(error => rejects(console.log(error)))
    })
} 


/**
 * receives an object containing the data that will be extracted and included in the dynamic text.
 * @param {object} data  
 * @param {string} message 
 * @returns {string} The text with the placeholders (or keyword) replaced by the intended data.
 */
exports.adaptDinamicMessage = (data, message) => {
    const placeholders = {
        "{nome}": "name",
        "{celular}": "telephone",
        "{valorCompra}": "purchaseValue",
        "{dataBonus}": "datePurchase",
        "{bonus}": "bonus",
        "{vencimentoBonus}": "expiryDate",
        "{empresa}": configs.companyName
    }

    for(let placeholder in placeholders){
        message = message.replaceAll(placeholder, data[placeholders[placeholder]])
    }

    return message;
}


exports.getRegisteredBonuses = () => {
    try {
        return JSON.parse(fs.readFileSync('bonus/registeredBonuses.json', 'utf8'));
    } catch (error) {
        if (error.errno == -4058){
            fs.writeFileSync('bonus/registeredBonuses.json', "{}")

            return JSON.parse(fs.readFileSync('bonus/registeredBonuses.json', 'utf8'));
        } else {
            console.log(error)
        }
    };
}


exports.colunmAdapter = (dataTag, data) => {
    let space = "                ";
    let placeholder = ` ${dataTag}: `;

    return placeholder.concat(data).concat(space.slice(0, space.length - String(data).length)).concat("|")
}
