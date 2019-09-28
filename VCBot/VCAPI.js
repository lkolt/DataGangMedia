'use strict'

const fs = require('fs')
const axios = require('axios')
const FormData = require('form-data');

const max_attempts = 0
const subsite_id = 369096

class OsnovaAPI { // TODO: add 1 request per sec
    constructor (main_url) {
        this.token = this.get_token()
        this.main_url = main_url
        this.attempts = 0
    }

    async get_token () {
        return new Promise((resolve, reject) => {
            fs.readFile('token', 'utf8', (err, data) => {
                resolve(data)
            })
        })
    }

    async get_request (path, args) { // TODO: add args
        let res = await new Promise (async (resolve, reject) => {
            axios.get(this.main_url + path, { 
                headers: { 'X-Device-Token': await this.token }
            })
            .then((response) => {
                this.attempts = 0
                resolve({
                    err: null,
                    data: response.data
                })
            })
            .catch((error) => {
                console.log('Cant get path:', path, 'Recieve: ', JSON.stringify(error))
                console.log('Attempts:', this.attempts)
                if (this.attempts < max_attempts) {
                    this.attempts++
                    console.log('Try to reget login')
                    this.token = this.get_token()
                    this.get_request(path, args)
                } else {
                    reject({ err: error.code })
                }
            })
        })
        return await res
    }

    async post_request (path, args) { // TODO: add args
        const form = new FormData()
        for ( const key in args ) {
            form.append(key, args[key])
        }

        let res = await new Promise (async (resolve, reject) => {
            axios({ method: 'POST', 
                    url: this.main_url + path, 
                    headers: {
                        'X-Device-Token': await this.token,
                        'content-type': `multipart/form-data; boundary=${form._boundary}`
                    }, 
                    data: form
            })
            .then((response) => {
                this.attempts = 0
                resolve({
                    err: null,
                    data: response.data
                })
            })
            .catch((error) => {
                console.log('Cant get path:', path, 'Recieve: ', JSON.stringify(error))
                console.log('Attempts:', this.attempts)
                if (this.attempts < max_attempts) {
                    this.attempts++
                    console.log('Try to reget login')
                    this.token = this.get_token()
                    this.get_request(path, args)
                } else {
                    reject({ err: error.code })
                }
            })
        })
        return await res
    }

    async create_entry (title, text, attachments) {
        let form = {
            'title': title,
            'text': text,
            'subsite_id': subsite_id
            // 'attachments': attachments
        }

        return this.post_request('entry/create', form)
    }

    async create_comment (entry_id, text, reply_to, attachments) { // reply_to === 0 if doesnt need
        let form = {
            'id': entry_id,
            'text': text,
            'reply_to': reply_to
            // 'attachments': attachments
        }

        return this.post_request('comment/add', form)
    }
}

module.exports.get = (main_url) => {
    return new OsnovaAPI(main_url)
}
