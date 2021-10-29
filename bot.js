require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios').default;
const cron = require('node-cron');
const moment = require("moment");
const schedule = require('node-schedule');
const express = require('express');



const token = process.env.TG_TOKEN;
const apikey = process.env.API;

let bot;

// if production env, we use webhooks
// https://core.telegram.org/bots/api#setwebhook
// https://github.com/yagop/node-telegram-bot-api/blob/release/doc/api.md#TelegramBot+setWebHook
if (process.env.NODE_ENV === 'production') {
	bot = new TelegramBot(token);
	bot.setWebHook(process.env.HEROKU_URL + bot.token);
	console.log('**** BOT initiated ***** ');

} else {
	// otherwise, we use polling
	// differences between webhooks and polling:
	// https://core.telegram.org/bots/webhooks
	// https://stackoverflow.com/questions/40033150/telegram-bot-getupdates-vs-setwebhook
	bot = new TelegramBot(token, { polling: true });
}



const state = {
    tideApi: {},
}

const scheduleNotificationOnExtremes = (extremes) => {
    console.log(extremes)
    const cacheExtreme1 = extremes[0]
    const cacheExtreme2 = extremes[1]
    const cacheExtreme3 = extremes[2]
    const dateOne = new Date(cacheExtreme1.datetime)
    const dateTwo = new Date(cacheExtreme2.datetime)
    const dateThree = new Date(cacheExtreme3.datetime)


    const timeToSecond = moment(dateTwo).fromNow();
    const timeToThird = moment(dateThree).fromNow();
    bot.sendMessage(chatId, `Messages have been scheduled in ${timeToSecond} and ${timeToThird}! `);


    schedule.scheduleJob(dateOne, () => {
        bot.sendMessage(chatId, `Right now it is ${cacheExtreme1.state}! Next tide is ${cacheExtreme2.state} at ${timeToSecond}`);
    })

    schedule.scheduleJob(dateTwo, () => {
        bot.sendMessage(chatId, `Right now it is ${cacheExtreme2.state}! Next tide is ${cacheExtreme3.state} at ${timeToThird}`);
        callApi();
    })
}

const checkTides = () => {
    bot.sendMessage(chatId, `Logging: An API call has been made`);
    axios.get('https://tides.p.rapidapi.com/tides?latitude=38.96258&longitude=-9.42078', {
        headers: {
            'X-RapidAPI-Key': apikey,
        }
        })
    .then(function (response) {
        bot.sendMessage(chatId, `Logging: API call was succesful`);
        // handle success
        state.tideApi = response.data;
        scheduleNotificationOnExtremes(response.data.extremes);
    })
    .catch(function (error) {
        // handle error
        console.log(error);
    })
    .then(function () {
        // always executed
    });

}

console.log(`Bot started in the ${process.env.NODE_ENV} mode`);


// callApi();




// Matches "/echo [whatever]"
// So this is what a command looks like
bot.onText(/\/start/, (msg) => {

  
    const chatId = msg.chat.id;
     // the captured "whatever"
  
    // send back the matched "whatever" to the chat
    const sunglasses = "\u{1F60E}";

    bot.sendMessage(chatId, `Howzit bru ${sunglasses}`);
    bot.sendMessage(chatId, `For todays surf report, send /today`);
    bot.sendMessage(chatId, `For tomorrows surf report, send /tomorrow`);
    bot.sendMessage(chatId, `For the current tidetable, send /tide`);
    bot.sendMessage(chatId, `Hang loose ${sunglasses}`);
  });

bot.onText(/\/tide/, (msg) => {

    
    const chatId = msg.chat.id;
     // the captured "whatever"
  
    // send back the matched "whatever" to the chat
    const sunglasses = "\u{1F60E}";
    const sunglasses = "\u{1F60E}";

    bot.sendMessage(chatId, `Howzit bru ${sunglasses}`);
    bot.sendMessage(chatId, `For todays surf report, send /today`);
    bot.sendMessage(chatId, `For tomorrows surf report, send /tomorrow`);
    bot.sendMessage(chatId, `For the current tidetable, send /tide`);
    bot.sendMessage(chatId, `Hang loose ${sunglasses}`);
  });




  module.exports = bot;