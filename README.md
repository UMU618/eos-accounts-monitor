# eos-accounts-monitor

Monitor balance and resources of EOS accounts

## Install

1. Install dependencies

```
yarn install
```

2. Copy and edit accounts.json, conf.js as your need.

```
cp accounts.json.example accounts.json
cp conf.js.example conf.js
```

Unit:

- Balance: EOS
- CPU: us
- RAM: Bytes

3. Add to crontab

```
0 * * * * /home/ubuntu/eos-accounts-monitor/index.js
```
