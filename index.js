#!/usr/bin/env node
/**
 * @author UMU618 <umu618@hotmail.com>
 * @copyright MEET.ONE 2019
 * @description Use block-always-using-brace npm-coding-style.
 */

'use strict'

const ME = 'eos-accounts-monitor'

const assert = require('assert')
const os = require('os')

const conf = require('./conf')
assert(conf.url)
const accounts = require('./accounts')
assert(accounts.length)
const alerts = require('./utils/alerts')

const { JsonRpc } = require('eosjs')
const fetch = require('node-fetch')
const rpc = new JsonRpc(conf.url, { fetch })

let index = 0
let retry = 0

main()

function main() {
  const ac = accounts[index]
  rpc
    .get_account(ac.account)
    .then(res => {
      // console.log(res.account_name, '"' + res.core_liquid_balance +'"'
      //   , res.cpu_limit.available, res.ram_quota - res.ram_usage)
      retry = 0
      if (res) {
        if (ac.balance && parseFloat(res.core_liquid_balance) < ac.balance) {
          alerts.sendDingtalk(conf.dingtalkInfoToken
            , (new Date).toJSON() + ', ' + os.hostname() + ', ' + ME + ': '
            + ac.account + ' balance is not enough.')
        }
        if (ac.cpu && res.cpu_limit.available < ac.cpu) {
          alerts.sendDingtalk(conf.dingtalkInfoToken
            , (new Date).toJSON() + ', ' + os.hostname() + ', ' + ME + ': '
            + ac.account + ' CPU is not enough.')
        }
        if (ac.ram && res.ram_quota - res.ram_usage < ac.ram) {
          alerts.sendDingtalk(conf.dingtalkInfoToken
            , (new Date).toJSON() + ', ' + os.hostname() + ', ' + ME + ': '
            + ac.account + ' RAM is not enough.')
        }
      }

      ++index
      if (index < accounts.length) {
        main()
      }
    })
    .catch(e => {
      console.error(JSON.stringify(e.json, null, 2))
      ++retry
      if (retry <= conf.maxRetry) {
        main()
      } else {
        alerts.sendDingtalk(ERROR_TOKEN
          , (new Date).toJSON() + ', ' + os.hostname() + ', ' + ME + ': query '
          + ac.account + ' failed for ' + conf.maxRetry + ' times.')
      }
    })
}
