require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios').default;
const cron = require('node-cron');
const moment = require("moment");
const schedule = require('node-schedule');



const chatId = 28083587;


const token = process.env.TG_TOKEN;
const apikey = process.env.API;

const bot = new TelegramBot(token, {polling: true});

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

    schedule.scheduleJob(dateOne, () => {
        bot.sendMessage(chatId, `Right now it is ${cacheExtreme1.state}! Next tide is ${cacheExtreme2.state} at ${timeToSecond}`);
    })

    schedule.scheduleJob(dateTwo, () => {
        bot.sendMessage(chatId, `Right now it is ${cacheExtreme2.state}! Next tide is ${cacheExtreme3.state} at ${timeToThird}`);
        callApi();
    })
}

const callApi = () => {
    axios.get('https://tides.p.rapidapi.com/tides?latitude=38.96258&longitude=-9.42078', {
        headers: {
            'X-RapidAPI-Key': apikey,
        }
        })
    .then(function (response) {
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

callApi();



cron.schedule('* * * * *', () => {
    console.log(state.tideApi);
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


//   {
//     disclaimer: 'NOT SUITABLE FOR NAVIGATIONAL PURPOSES. API Hood does not warrant that the provided data will be free from errors or omissions. Provided data are NOT suitable for usage where someone could be harmed or suffer any damage.',
//     status: 200,
//     latitude: 38.9668,
//     longitude: 9.4062,
//     origin: { latitude: 38.9375, longitude: 9.375, distance: 4.23, unit: 'km' },
//     datums: { LAT: -0.18274951934814454, HAT: 0.20117876052856445 },
//     timestamp: 1635433008,
//     datetime: '2021-10-28T14:56:48+00:00',
//     unit: 'm',
//     timezone: 'UTC',
//     datum: 'MSL',
//     extremes: [
//       {
//         timestamp: 1635453962,
//         datetime: '2021-10-28T20:46:02+00:00',
//         height: -0.020747371053910574,
//         state: 'LOW TIDE'
//       },
//       {
//         timestamp: 1635470459,
//         datetime: '2021-10-29T01:20:59+00:00',
//         height: 0.005130373957475037,
//         state: 'HIGH TIDE'
//       },
//       {
//         timestamp: 1635492199,
//         datetime: '2021-10-29T07:23:19+00:00',
//         height: -0.05517845594405538,
//         state: 'LOW TIDE'
//       }
//     ],
//     heights: [
//       {
//         timestamp: 1635433008,
//         datetime: '2021-10-28T14:56:48+00:00',
//         height: 0.07011240555505852,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635436608,
//         datetime: '2021-10-28T15:56:48+00:00',
//         height: 0.05238585303977503,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635440208,
//         datetime: '2021-10-28T16:56:48+00:00',
//         height: 0.030108886124782408,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635443808,
//         datetime: '2021-10-28T17:56:48+00:00',
//         height: 0.008310809750269663,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635447408,
//         datetime: '2021-10-28T18:56:48+00:00',
//         height: -0.00867040071661269,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635451008,
//         datetime: '2021-10-28T19:56:48+00:00',
//         height: -0.018401996078194923,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635454608,
//         datetime: '2021-10-28T20:56:48+00:00',
//         height: -0.020643685078418468,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635458208,
//         datetime: '2021-10-28T21:56:48+00:00',
//         height: -0.01672834159250827,
//         state: 'RISING'
//       },
//       {
//         timestamp: 1635461808,
//         datetime: '2021-10-28T22:56:48+00:00',
//         height: -0.008944846333912371,
//         state: 'RISING'
//       },
//       {
//         timestamp: 1635465408,
//         datetime: '2021-10-28T23:56:48+00:00',
//         height: -0.000579315130324389,
//         state: 'RISING'
//       },
//       {
//         timestamp: 1635469008,
//         datetime: '2021-10-29T00:56:48+00:00',
//         height: 0.0046097345117305415,
//         state: 'RISING'
//       },
//       {
//         timestamp: 1635472608,
//         datetime: '2021-10-29T01:56:48+00:00',
//         height: 0.003941789130586552,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635476208,
//         datetime: '2021-10-29T02:56:48+00:00',
//         height: -0.0033282342117077935,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635479808,
//         datetime: '2021-10-29T03:56:48+00:00',
//         height: -0.016168497254746943,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635483408,
//         datetime: '2021-10-29T04:56:48+00:00',
//         height: -0.03178444386443984,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635487008,
//         datetime: '2021-10-29T05:56:48+00:00',
//         height: -0.045935237912682315,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635490608,
//         datetime: '2021-10-29T06:56:48+00:00',
//         height: -0.05423942139413974,
//         state: 'FALLING'
//       },
//       {
//         timestamp: 1635494208,
//         datetime: '2021-10-29T07:56:48+00:00',
//         height: -0.0536300094556496,
//         state: 'RISING'
//       },
//       {
//         timestamp: 1635497808,
//         datetime: '2021-10-29T08:56:48+00:00',
//         height: -0.0431306527303145,
//         state: 'RISING'
//       },
//       {
//         timestamp: 1635501408,
//         datetime: '2021-10-29T09:56:48+00:00',
//         height: -0.023741792444227975,
//         state: 'RISING'
//       },
//       {
//         timestamp: 1635505008,
//         datetime: '2021-10-29T10:56:48+00:00',
//         height: 0.002109792936819938,
//         state: 'RISING'
//       },
//       {
//         timestamp: 1635508608,
//         datetime: '2021-10-29T11:56:48+00:00',
//         height: 0.03059665788791546,
//         state: 'RISING'
//       },
//       {
//         timestamp: 1635512208,
//         datetime: '2021-10-29T12:56:48+00:00',
//         height: 0.0565745755681405,
//         state: 'RISING'
//       },
//       {
//         timestamp: 1635515808,
//         datetime: '2021-10-29T13:56:48+00:00',
//         height: 0.07499955989865444,
//         state: 'RISING'
//       }
//     ],
//   }
  