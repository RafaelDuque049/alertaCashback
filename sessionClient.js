"use strict";

require("dotenv").config();

const wppconnect = require('@wppconnect-team/wppconnect');

const { listener } = require('./main');

wppconnect.create({
    session: 'alertaCashback',
    //  Session Status: //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken
    statusFind: statusSession => console.log('Session status: ', statusSession), 
    useChrome: false,
    folderNameToken: "./privateToken",
    disableWelcome: true,
    updatesLog: false,
    autoclose: 300,
    // puppeteerOptions: {
    //     userDataDir: `./privateToken`,
    // },
    }) 
    .then((sessionClient) => {
        listener(sessionClient)
    })
    .catch((error) => console.log(error));
