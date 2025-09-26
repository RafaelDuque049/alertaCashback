'use strict';

// Dependencies
const fs = require('fs');

// Modules
const { adaptDinamicMessage, convertRealToNumber, colunmAdapter } = require('./tools');

// Files
const configs = JSON.parse(fs.readFileSync('./configs.json', 'utf-8'));
const response = JSON.parse(fs.readFileSync('./response.json', 'utf-8'));


/**
 * @param {object} sessionClient receives the object for session manipulation;
 * @param {object} clientList receives a list of customer objects already filtered and organized;
 * @param {object} registredBonuses receives a list of objects containing the bonuses already saved; 
 */
exports.sendCashbacks = async (sessionClient, clientList, registeredBonuses) => {
    for(let clientIndex in clientList){
        let telephone = process.env.AMBIENT.includes("PRODUCTION")
                    ? `55${clientList[clientIndex].telephone}@c.us` 
                    : process.env.DEVELOPERS_NUMBERS

        if(clientList[clientIndex].processSendBonus){
            await sessionClient.startTyping(telephone, configs.timeTyping);
            
            await sessionClient
                .sendText(telephone, adaptDinamicMessage(clientList[clientIndex], configs.defaultMessage))
                .then(result => {})
                .catch(err => {
                    clientList[clientIndex].processSendBonus = false; 
                    clientList[clientIndex].reasonForNotSending = response.sendingFailure;
                    console.log(err)
                })
        }

        clientList[clientIndex]["acessTimestamp"] = Math.round(new Date().getTime() / 1000);

        console.log(clientList[clientIndex])
    }

    fs.writeFileSync('bonus/registeredBonuses.json', JSON.stringify(Object.assign(registeredBonuses, clientList)))
    
    createAuditReport(sessionClient, clientList)
}


/**
 * Generates a report on the triggering process and sends it to those in charge (Developers or Managers) via WhatsApp for auditing;
 * @param {Object} sessionClient receives the object for session manipulation; 
 * @param {Object} shippingRecord receives the trigger data;
 */
async function createAuditReport(sessionClient, shippingRecord){
    let alertsSent = 0;
    let alertsNotSent = 0;
    let totalBonus = 0;
    let totalBonusSent = 0;
    let clientReportList = [];
    let timestamp = Math.round(new Date().getTime() / 1000);

    
    for(let clientInfo in shippingRecord){
        if (shippingRecord[clientInfo].processSendBonus === true){
            ++alertsSent
            totalBonusSent += convertRealToNumber(shippingRecord[clientInfo].bonus)
        } else (
            ++alertsNotSent
        )
        
        totalBonus += convertRealToNumber(shippingRecord[clientInfo].bonus)

        clientReportList.push(
            `\n${colunmAdapter("Time", shippingRecord[clientInfo].acessTimestamp)}` +
            `${colunmAdapter("Telefone", shippingRecord[clientInfo].telephone)}` +
            `${colunmAdapter("Nome", shippingRecord[clientInfo].name)}` +
            `${colunmAdapter("Valor", shippingRecord[clientInfo].bonus)}` +
            `${colunmAdapter("Enviado", shippingRecord[clientInfo].processSendBonus)}` +
            `${colunmAdapter("Motivo", shippingRecord[clientInfo].reasonForNotSending)}`
        )
    }

    let defaultReport = 
        `Total Cashbacks: ${alertsSent + alertsNotSent}\n`
        +`Total de alertas enviados: ${alertsSent} (${(alertsSent * 100) / (alertsSent + alertsNotSent)}%)\n`
        +`Total alertas não enviados: ${alertsNotSent} (${(alertsNotSent * 100) / (alertsSent + alertsNotSent)}%)\n`
        +`Valor total de Cashbacks: R$ ${String(totalBonus.toFixed(2)).replace('.', ',')}\n`
        +`Valor total de Cashbacks enviados: R$ ${String(totalBonusSent.toFixed(2)).replace('.', ',')} (${(totalBonusSent * 100) / totalBonus}%)\n`;


    clientReportList.forEach(element => {
        defaultReport = defaultReport.concat(element)
    })

    fs.writeFileSync(`reports/report-${timestamp}.txt`, defaultReport)

    sessionClient.sendFile(process.env.DEVELOPERS_NUMBERS, `reports/report-${timestamp}.txt`, `report-${timestamp}.txt`)
        .then(result => console.log(result))
        .catch(err => console.log(err))
}   
