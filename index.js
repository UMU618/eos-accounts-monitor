#!/usr/bin/env node
/**
 * @author UMU618 <umu618@hotmail.com>
 * @copyright MEET.ONE 2019
 * @description Use block-always-using-brace npm-coding-style.
 */

'use strict'

const ME = 'eos-accounts-monitor'

const assert = require('assert')
const debug = require('debug')(ME)
const os = require('os')

const conf = require('./conf')
assert(conf.url)
const accounts = require('./accounts')
const tables = require('./tables')
assert(accounts.length || tables.length)
debug('accounts.length =', accounts.length)
debug('tables.length =', tables.length)
const alerts = require('./utils/alerts')

const { JsonRpc } = require('eosjs')
const fetch = require('node-fetch')
const rpc = new JsonRpc(conf.url, { fetch })

let index = 0
let retry = 0

let infoMessage = ''
let errorMessage = ''

queryAccounts()

function getTableRows(code, scope, table, key) {
  return rpc.get_table_rows({
    json: true, code: code, scope: scope
    , table: table, lower_bound: key, upper_bound: key, limit: 1
  })
}

function queryAccounts() {
  if (index >= accounts.length) {
    index = 0
    queryTables()
    return
  }

  const ac = accounts[index]
  rpc
    .get_account(ac.account)
    .then(res => {
      debug(res.account_name, '"' + res.core_liquid_balance +'"'
        , res.cpu_limit.available, res.ram_quota - res.ram_usage)
      retry = 0
      if (res) {
        if (ac.balance && parseFloat(res.core_liquid_balance) < ac.balance) {
          infoMessage += '\n  ' + ac.account + ' balance is '
            + res.core_liquid_balance + ', less then ' + ac.balance + '.'
        }
        if (ac.cpu && res.cpu_limit.available < ac.cpu) {
          infoMessage += '\n  ' + ac.account + ' CPU is less then ' + ac.cpu
            + 'us.'
        }
        if (ac.ram && res.ram_quota - res.ram_usage < ac.ram) {
          infoMessage += '\n  ' + ac.account + ' RAM is less then ' + ac.ram
            + 'bytes.'
        }
      }

      ++index
      queryAccounts()
    })
    .catch(e => {
      console.error(JSON.stringify(e.json, null, 2))
      ++retry
      if (retry <= conf.maxRetry) {
        queryAccounts()
      } else {
        errorMessage += '\n  query ' + ac.account + ' failed for '
          + conf.maxRetry + ' times.'
        queryTables()
      }
    })
}

function queryTables() {
  if (index >= tables.length) {
    notify()
    return
  }

  const t = tables[index]
  getTableRows(t.code, t.scope, t.table, t.key)
    .then(res => {
      retry = 0
      if (res && res.rows && res.rows[0] && res.rows[0][t.rowKey]) {
        debug(t.code + '/' + t.scope + '/' + t.table + '/'
          + t.key + '/' + t.rowKey, '=', res.rows[0][t.rowKey])
        const v = parseFloat(res.rows[0][t.rowKey])
        if (v < parseFloat(t.rowValue)) {
          infoMessage += '\n  ' + t.code + '/' + t.scope + '/' + t.table + '/'
            + t.key + '/' + t.rowKey + ' is ' + res.rows[0][t.rowKey]
            + ', less then ' + t.rowValue + '.'
            + '\n    Check: https://bloks.io/contract?tab=Tables&table='
            + t.table + '&account=' + t.code + '&scope=' + t.scope
            + '&limit=1&lower_bound=' + t.key + '&upper_bound=' + t.key
        }
      }

      ++index
      queryTables()
    })
    .catch(e => {
      console.error(JSON.stringify(e.json, null, 2))
      ++retry
      if (retry <= conf.maxRetry) {
        queryTables()
      } else {
        errorMessage += '\n  query ' + t.code + '/' + t.scope + '/' + t.table
          + '/' + t.key + ' failed for ' + conf.maxRetry + ' times.'
        notify()
      }
    })
}

function notify() {
  if (infoMessage) {
    alerts.sendDingtalk(conf.dingtalkInfoToken, conf.dingtalkInfoSecret
      , (new Date).toJSON() + ', ' + os.hostname() + ', ' + ME + ':'
      + infoMessage)
  }

  if (errorMessage) {
    alerts.sendDingtalk(conf.dingtalkErrorToken, conf.dingtalkErrorSecret
      , (new Date).toJSON() + ', ' + os.hostname() + ', ' + ME + ':'
      + errorMessage)
  }

  debug('end')
}