// mpesa.js
const axios = require('axios');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { Buffer } = require('buffer');

const consumerKey = 'WDFLARDWgYIiMl9DQEdh8DZj7PJspNtsQA04bCKJiCicGWHM';
const consumerSecret = 'xCZEpzUl2HxGEI188T0t32e7hFIDcRPAw07Lsd32H3uTmqkKkKIyzNAIpT6W7ek8';
const shortCode = '112410601';
const passkey = 'nwjyRcjcz2jBMqByCzQLxjnke9b1VO7WQEXqTulaFSqCPCHX+McZ6s9/bn5kS1VRIxQes458vcx1Sr2vVXad6cWFbtN+BtzbhNd7wZbGDJQBTiASAeNW+T3JEyN5+RBY+9p5KU0tdcIIoaH7iS12FGiOw9oMjG36IEPwl9wROgrZ8V60Jtml5pDw6rDBvOyS466iPrI+2xxFEfbMzYT1Wt7gGEaJg//f6YAthusyEPSicq1Fbwx4F/oqtnibGRnP8572R29AghJ/ZdJxJrnnjVa1vmhCShul07m1d7GaNMSTtMmdMHEOkaxtjj5Fy+AKI6oBLi7aHxxpB25Sl06LgA==';
const callbackURL = 'https://skinet.com/payment';  // URL to handle M-Pesa payment notifications

const generateAccessToken = async () => {
    const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error generating access token:', error);
        throw new Error('Could not generate access token');
    }
};

const stkPush = async (mobileNumber, price) => {
    const accessToken = await generateAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const transactionId = uuidv4();

    const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    const data = {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: price,
        PartyA: mobileNumber,
        PartyB: shortCode,
        PhoneNumber: mobileNumber,
        CallBackURL: "https://skinet.com/payment",
        AccountReference: "payment id",
        TransactionDesc: 'Payment for internet package',
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error initiating STK push:', error);
        throw new Error('Could not initiate STK push');
    }
};

module.exports = {
    stkPush,
};
