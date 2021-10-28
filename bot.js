require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios').default;
const cron = require('node-cron');
const moment = require("moment");
const schedule = require('node-schedule');
const express = require('express');




const chatId = 28083587;


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
	logger.info('Bot started', {
		success: true,
		successMessage: '**** BOT initiated *****',
		failureMessage: '',
		messageId: null,
		isBot: null,
		lang: null,
	});
} else {
	// otherwise, we use polling
	// differences between webhooks and polling:
	// https://core.telegram.org/bots/webhooks
	// https://stackoverflow.com/questions/40033150/telegram-bot-getupdates-vs-setwebhook
	bot = new TelegramBot(token, { polling: true });
}



const state = {
    tideApi: {},
    extremes: [],
    options: {}
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

const callApi = () => {
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


callApi();



cron.schedule('0 0 */12 * * *', () => {
    bot.sendMessage(chatId, `This is the message that is sent every 12 hours.`);
  });

// Matches "/echo [whatever]"
// So this is what a command looks like
bot.onText(/\/echo (.+)/, (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message
    


  
    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"
  
    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, resp);
  });



// Listen for any kind of message. There are different kinds of
// messages.
// This is triggered by a message
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log(chatId)
  
    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chatId, 'Testing');
  });

