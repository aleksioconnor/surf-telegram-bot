require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios').default;
const cron = require('node-cron');
const moment = require("moment-timezone");
const schedule = require('node-schedule');
const express = require('express');
const _ = require('lodash');


moment().tz("Europe/Lisbon").format();


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
    tideApi: null,
}


  
  const lowOrHigh = (tide) => {
   return tide == 'LOW TIDE' ? {verb: 'falling', noun: 'low tide'} : {verb: 'rising', noun: 'high tide'};
  }

// low-to-mid = lm
// mid-to-high = mh
// high-to-mid hm
//mid-to-low ml
// mid m
// all

  const spots = {
      foz_de_lizandro: {
          tide: 'low/mid',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/foz-do-lizandro/',
          name: 'Foz de Lizandro',
          type: 'beach',
          cam: 'https://beachcam.meo.pt/livecams/foz-do-lizandro/'
      },
      limipicos: {
          tide: 'mid/high',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/limipicos/',
          type: 'reef',
          name: 'Limipicos'
      },
      praia_do_sul: {
          tide: 'low/mid',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/praia-do-sul/',
          name: 'Praia do Sul',
          type: 'sand & rock',
          cam: 'https://www.surfline.com/surf-report/praia-do-sul/5fb2c2da7057d993d9d2caa3'
      },
      furnas: {
          tide: 'low/mid',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/furnas/',
          name: 'Furnas',
          type: 'sand & rock'
      },
      praia_da_norte: {
          tide: 'low/mid',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/praia-do-norte/',
          name: 'Praia da Norte',
          type: 'sand & reef'
      },
      sao_sebastiao: {
          name: 'São Sebastiao',
          tide: 'mid/all',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/sao-sebastiao/',
          type: 'reef',
      },
      praia_do_pescadores: {
          name: 'Praia dos Pescadores',
          tide: 'low',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/praia-dos-pescadores/',
          cam: 'https://beachcam.meo.pt/livecams/praia-dos-pescadores/',
          type: 'sand'
      },
      matadouro: {
          tide: 'mid,high',
          name: 'Matadouro',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/matadouro/',
          cam: 'https://beachcam.meo.pt/livecams/matadouroskateparke/',
          type: 'reef'
      },
      paparoucos: {
          tide: 'all',
          name: 'Paparoucos',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/paparoucos/',
          type: 'reef',
      },
      ribeira: {
          tide: 'mid/all',
          name: "Ribeira D'Ilhas",
          link: 'https://www.ericeirasurfhouse.com/surf-spots/ribeira-dilhas/',
          cam: 'https://beachcam.meo.pt/livecams/ribeira-dilhas/',
          type: 'reef',
      },
      sao_lourenco: {
          tide: 'low/mid/all',
          name: 'Sao Lourenco',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/sao-lourenco/',
          type: 'reef'
      },
      sao_juliao: {
          name: 'Sao Juliao',
          tide: 'low/mid/all',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/sao-juliao/',
          type: 'sand'
      },
      praia_da_vigia: {
          name: 'Praia da Vigia',
          tide: 'mid/all',
          link: 'https://www.ericeirasurfhouse.com/surf-spots/praia-da-vigia/',
          type: 'sand'
      }


  }

  const isMidTide = (extremes) => {
    const currentTime = moment().utc();
    const end = moment(extremes[0].datetime);
    const duration = moment.duration(end.diff(currentTime));
    if(duration.asHours() > 2 && duration.asHours() < 4) return true;
    else return false;
}

const lowToHigh = (extremes) => {
    console.log("lowToHigh")
    const currentTime = moment().utc();
    const end = moment(extremes[0].datetime);
    const duration = moment.duration(end.diff(currentTime));
    const lh = lowOrHigh(extremes[0].state);
    // if(duration.asHours() > 2 && duration.asHours() < 4) return 'mid';
     if (lh.verb == 'falling') {
        // next tide is lowc
        if(duration.asHours() < 1.7) {
            return 'low'
        }
        else if(duration.asHours() > 4.4) {
            return 'high'
        }
        else return 'mid';
    }
    else {
        if(duration.asHours() < 1.7) {
            return 'high';
        }
        else if(duration.asHours() > 4.4) {
            return 'low';
        }
        else {
            return 'mid';
        }
    }
}

const getSurfSpots = (tidePhase) => {
    const spotsThatWork = _.filter(spots, (spot) => {
        const works = _.includes(spot.tide, tidePhase) || _.includes(spot.tide, 'all');
        return works;
    })
    return spotsThatWork;
}

const formatSpots = (spots) => {
    const mapped = _.map(spots, (spot) => {
        const cam = spot.cam ? `[link to beachcam](${spot.cam})` : '';
        return `**[${spot.name}](${spot.link})**, ${spot.type} ${cam}\n`
    })
    return _.join(mapped, ' ');
}

const sendTideMsg = (msg) => {
    const extremes = state.tideApi.extremes;
    const nextState =  lowOrHigh(extremes[0].state)
    console.log(extremes[0].datetime, "orig")
    console.log(moment.utc(extremes[0].datetime), "moment")
    const timeToNextState = moment.utc(extremes[0].datetime).fromNow();
    const nextStateTime = moment.utc(extremes[0].datetime).format("hh:mm a");

    // Next tides

    const mid = isMidTide(extremes);
    const currentTide = lowToHigh(extremes)
    const spotsThatWork = getSurfSpots(currentTide);
    const spotList = formatSpots(spotsThatWork)

    const opts = { parse_mode: 'Markdown', disable_web_page_preview: true }
    const third = extremes[3] ? `${lowOrHigh(extremes[3].state).noun} at ${moment.utc(extremes[3].datetime).format("hh:mm a")}` : '';

    const midTideMessage = mid ? ` and it is currently midtide` : '';
    
    const tideChart = `The tide is currently ${nextState.verb}${midTideMessage}. Next ${nextState.noun} is ${timeToNextState} at ${nextStateTime}.
    \n*Next tide extremes:* 
- ${lowOrHigh(extremes[0].state).noun} at ${moment.utc(extremes[0].datetime).format("hh:mm a")}
- ${lowOrHigh(extremes[1].state).noun} at ${moment.utc(extremes[1].datetime).format("hh:mm a")}
- ${lowOrHigh(extremes[2].state).noun} at ${moment.utc(extremes[2].datetime).format("hh:mm a")}
- ${third}\n\n**Spots that work on ${currentTide} tide:\n ${spotList}`
        bot.sendMessage(msg.chat.id, tideChart, opts);
}




const checkTides = (msg) => {
    if (state.tideApi == null || moment(state.tideApi.extremes[0].datetime).isBefore(moment().utc())) {
        axios.get('https://tides.p.rapidapi.com/tides?latitude=38.96258&longitude=-9.42078', {
            headers: {
                'X-RapidAPI-Key': apikey,
            }
            })
        .then(function (response) {
            // console.log(response.data)
            state.tideApi = response.data;
            sendTideMsg(msg);
            
        })
        .catch(function (error) {
            console.log(error)
            bot.sendMessage(msg.chat.id, `Tidechart is currently unavailable, sorry.`);
        })
        .then(function () {
        });
    }
    else {
        sendTideMsg(msg);

    }


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

    bot.sendMessage(chatId, `Howzit bru ${sunglasses}`).then(() => {
        bot.sendMessage(chatId, `${sunglasses}`).then(() => {
            bot.sendMessage(chatId, ``).then(() => {
                bot.sendMessage(chatId, `For the current tidetable, send /tide`).then(() => {
                })
            })
        })
    })
  });

bot.onText(/\/tide/, (msg) => {
    console.log("hey")
    console.log(moment().utc())
    checkTides(msg);
  });




  module.exports = bot;