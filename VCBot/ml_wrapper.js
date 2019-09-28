'use strict'

const WebSocket = require('ws')

const ml_url = 'ws://localhost:8000'

class wrapper {
    constructor () {
        this.id = 0
        this.answers = []
        this.posts = []
        this.queue = []
        this.resolvers = []
        this.init()
    }

    async init () {
        this.ready = new Promise((resolve, reject) => {
            this.ws = new WebSocket(ml_url)
            console.log('Setting up ws')
            this.ws.on('open', () => {
                console.log('Connection to wrapper open!')
                resolve(true)
            })
            this.ws.on('message', (data) => {
                let msg = JSON.parse(data)
                let id = msg.id
                this.answers[id] = this.resolvers[id](msg.text)
            })
        })
    }

    async proccess (posts) {
        console.log('proccessing posts:', posts, '...')
        let ready = await this.ready
        if (ready) {
            let start_id = this.id
            for (let post of posts) {
                this.posts[this.id] = post
                let msg = {
                    id: this.id,
                    text: post.text
                }
                this.answers[this.id] = new Promise ((resolve, reject) => {
                    this.resolvers[this.id] = resolve
                })
                this.id++
                this.ws.send(JSON.stringify(msg))
            }

            let res = []
            for (let i = start_id; i < this.id; i++) {
                let post = this.posts[i]
                post.text = await this.answers[i]
                res.push(post)
            }
            return res
        }
        return []
    }
}

module.exports.get = () => {
    return new wrapper()
}

