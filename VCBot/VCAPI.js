'use strict'

const fs = require('fs')
const axios = require('axios')

const url_vc = 'https://api.vc.ru/v1.8/'
const max_attempts = 2

class OsnovaAPI {
    constructor () {
        this.token = this.get_token()
        this.attempts = 0
    }

    async get_token () {
        return new Promise((resolve, reject) => {
            fs.readFile('token', 'utf8', (err, data) => {
                resolve(data)
            })
        })
    }

    async get_request (path, args) {
        axios.get(url_vc + path, { headers: {
                'X-Device-Token': await this.token,
          }})
          .then((response) => {
                this.attempts = 0
                console.log(response)
          })
          .catch((error) => {
                console.log('Cant get path:', path, 'Recieve: ', error)
                console.log('Attempts:', this.attempts)
                if (this.attempts < max_attempts) {
                    this.attempts++
                    console.log('Try to reget login')
                    this.token = this.get_token()
                    this.get_request(path, args)
                }
          })
    }
}

let api = new OsnovaAPI()
api.get_request('user/me')