'use strict'

const ReconnectingWebSocket = require('reconnecting-websocket')
const sleep = require('sleep')

const ml_url = 'localhost:8080'

class wrapper {
    constructor () {
        this.id = 0
        this.answers = []
        this.posts = []
        this.ws = new ReconnectingWebSocket(ml_url) 
        this.ws.addEventListener('open', () => {
            console.log('Connection to wrapper open!')
        })
        this.ws.addEventListener('message', (msg) => {
           this.answers[msg.data.id] = msg.data.text
        })
    }

    check_recieve (min_id) {
        let idx = this.id - 1
        while (idx >= min_id) {
            if (!this.answers[id]) {
                return false
            }
        }
        return true
    }

    proccess (posts) {
        start_id = this.id
        for (let post of posts) {
            this.posts[this.id] = post
            this.ws.send({
                id: this.id++,
                text: post.text
            })
        }

        while (!this.check_recieve(min_id)) {
            sleep.sleep(1) // 1 sec
        }

        let res = []
        for (let i = start_id; i < this.id; i++) {
            let post = this.posts[i]
            post.text = this.answers[i]
            res.push(post)
        }

        return res
    }
}

module.exports.get = () => {
    return new wrapper()
}