const token = '5998330146:AAHx-agp1PAkYJtHTZmijjsrhnOeMPWg0e4'
const db = require('./db')
var TelegramBot = require('node-telegram-bot-api');
const multer = require('multer');
const express = require('express')
const cors = require('cors');
const { json } = require('express');

const wepAppUrl = 'https://master--ubiquitous-pony-af278a.netlify.app'

const imageUpload = multer({
  dest: 'images',
});

var bot = new TelegramBot(token, {polling: true});
const app = express()

app.use(cors())
app.use(express.json())

 
bot.on('message', async (msg) =>  {
  var chatId = msg.chat.id;
  const text = msg.text
  let isKeyboard = false
  if(text === '/menuKFC'){
    await bot.sendMessage(chatId, 'Ниже появится кнопка, заполни форму', {
        reply_markup: {
            inline_keyboard: [ 
                [{text: 'Заполните форму', web_app: {url: wepAppUrl}}]
            ]
        }
    })
    return 0
  }
  if(text === '/formForInfo'){
    await bot.sendMessage(chatId, 'Ниже появится кнопка, заполни форму', {
        reply_markup: {
            keyboard: [
                [{text: 'Заполните форму', web_app: {url: wepAppUrl + '/form'}}]
            ]
        }
    })
    return 0
  }
  if(msg?.web_app_data?.data){
    try {
      const data = JSON.parse(msg?.web_app_data?.data)
      await bot.sendMessage(chatId, 'Спасибо за обратную связь!')
      await bot.sendMessage(chatId, `Ваша страна: ${data?.country}`)
      await bot.sendMessage(chatId, `Ваша улица: ${data?.street}`)
      setTimeout(async ()=>{
        await bot.sendMessage(chatId, `Все ваши данные, с любовью, КФС`)
      }, 3000)
    } catch (error) {
      console.log(error)
    }
    return 0
  }
  else bot.sendMessage(chatId, 'Я тебя не понимаю');
});

const PORT = 8000

app.listen(PORT, ()=> {
  console.log(`server started ${PORT}`)
})

app.post('/web-data', async (req, res) => {
  const {queryId, products, totalPrice} = req.body
  try {
    await bot.answerWebAppQuery(queryId, {
      type: 'article',
      id: queryId,
      title: 'Успешная покупка',
      input_message_content: {
          message_text: ` Поздравляю с покупкой, вы приобрели товар на сумму ${totalPrice}, ${products.map(item => item.title).join(', ')}`
      }
  })
    res.status(200).json({})
  } catch (error) { 
    console.log(error)
    res.status(500).json({})
  }
})

app.post('/images', imageUpload.single('image'), async (req, res) => {
  const {id} = req.body
  const { filename, mimetype, size } = req.file;
  const filepath = req.file.path
  db
  .query('insert into image_files (filename, filepath, mimetype,size, prod_id) values ($1,$2,$3,$4, $5', [filename, filepath, mimetype, size, id])
  .catch(e => {
    console.log(e)
  })
})

  app.put('/images', async (req, res) => {
    const {id} = req.body
    const images = db
    .query('select * from image_files where prod_id = $1', [id])
    .catch(e => {
      console.log(e)
    })
    try {
      if (images.rows[0]) {
          const dirname = path.resolve();
          const fullfilepath = path.join(dirname, images.rows[0].filepath);
          return res.type(images.rows[0].mimetype).sendFile(fullfilepath);
        }
        return res.status(400).json({ success: false, message: 'not found'});
      }
      catch (error) {
        res.status(404).json({ success: false, message: 'not found', stack: err.stack })    
      }
  })