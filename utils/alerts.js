/**
 * @author UMU618 <umu618@hotmail.com>
 * @copyright MEET.ONE 2019
 * @description Use block-always-using-brace npm-coding-style.
 */

'use strict'

const fetch = require('node-fetch')

module.exports = {
  sendDingtalk: function (token, secret, text) {
    if (!token || !text) {
      console.log('Message: ' + text)
      return
    }

    let url = 'https://oapi.dingtalk.com/robot/send?access_token=' + token
    if (secret) {
      const timestamp = Date.now()
      const to_sign = timestamp + '\n' + secret
      const crypto = require('crypto')
      const hmac = crypto.createHmac('sha256', secret)
      const sign = hmac.update(to_sign).digest('base64')
      url += '&timestamp=' + timestamp + "&sign=" + encodeURIComponent(sign)
    }
    fetch(url, {
      method: 'POST'
      , headers: {
        'Content-Type': 'application/json'
      }
      , body: JSON.stringify({
        "msgtype": "text"
        , "text": {
          "content": text
        }
      })
    }).then((res) => {
      if (res.ok) {
        console.log('Message sent: ' + text)
      } else {
        console.log('status = ' + res.status)
      }
    }, (err) => {
      console.log(err)
    })
  }

  , sendTelegram: function (token, chat_id, text) {
    fetch('https://api.telegram.org/bot' + token + '/sendMessage?'
      + require('querystring').stringify({
        chat_id: chat_id, text: text
      }), { method: 'POST' })
      .then(function (res) {
        if (res.ok) {
          console.log('Telegram message sent!')
        } else {
          console.log('status = ' + res.status)
        }
      }, function (e) {
        console.log(e)
      })
  }
}
