'use strict'

const fs = require('fs')
const axios = require('axios')
const FormData = require('form-data')
const sleep = require('system-sleep')

const max_attempts = 0
const subsite_id = 369096

class OsnovaAPI {
    constructor (main_url) {
        this.last_request = 0
        this.token = this.get_token()
        this.main_url = main_url
        this.attempts = 0
    }

    async get_token () {
        return new Promise((resolve, reject) => {
            fs.readFile('token', 'utf8', (err, data) => {
                resolve(data.replace(' ', '').replace('\n', ''))
            })
        })
    }

    async get_request (path, args) {
        if (Date.now - this.last_request < 1000) {
            sleep(1000)
        }
        this.last_request = Date.now()

        const form = new FormData()
        for ( const key in args ) {
            form.append(key, args[key])
        }

        let res = await new Promise (async (resolve, reject) => {
            axios({ method: 'GET', 
                    url: this.main_url + path, 
                    headers: {
                        'X-Device-Token': await this.token
                    },
                    data: args
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

    async post_request (path, args) {
        if (Date.now - this.last_request < 1000) {
            sleep(1000)
        }
        this.last_request = Date.now()

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
                return resolve({
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
                    return this.post_request(path, args)
                } else {
                    return reject({ err: error.code })
                }
            })
        })
        return await res
    }

    async create_entry (title, text, image) {
        let form = {
            'title': title,
            'text': text,
            'subsite_id': subsite_id,
        }
        let attachments = []
        
        if (image) {
            const image_data = await this.post_request('uploader/extract', { url: image })
            
            if (image_data.data) {
                attachments = [ ...attachments, ...image_data.data.result ]
            } 
        }

        return this.post_request('entry/create', { ...form, attachments: JSON.stringify(attachments) })
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
