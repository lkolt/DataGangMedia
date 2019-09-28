'use strict'
const md5 = require('md5')
const fs = require('fs')

const VCAPI = require('./VCAPI')
const sources = require('./sources')
const ml_wrapper = require('./ml_wrapper')

const url_vc = 'https://api.vc.ru/v1.8/'

class bot {
    constructor () {
        this.api = VCAPI.get(url_vc)
        this.sources = sources.get()
        this.wrapper = ml_wrapper.get()
        this.idx = 0
        this.get_already_posted = this.get_already_posted()
        this.get_posts()
        setInterval(this.get_posts.bind(this), 1000 * 60 * 60)
        setInterval(this.run.bind(this), 1000 * 60 * 10)
    }

    async get_posts () {
        console.log('Getting posts!')
        this.idx = 0
        this.posts = this.sources.get_posts()
    }
    
    async get_post () {
        let posts = await this.posts
        let alredy = await this.get_already_posted
        while (this.idx < posts.length) {
            let post = posts[this.idx++]
            post['md5'] = md5(post['text'])
            this.idx++
            if (!alredy.includes(post['md5'])){
                return [post]
            }
        }
        
        return []
    }

    async get_already_posted () { // TODO: get from VC.ru
        return new Promise((resolve, reject) => {
            fs.readFile('posted.db', 'utf8', (err, data) => {
                resolve(data.split('\n'))
            })
        })
    }

    new_post (md5) {
        fs.appendFile('posted.db', md5 + '\n', () => {})
    }

    async run () {
        let new_posts = await this.get_post()
        if (new_posts.length) {
            let formatted_posts = await this.wrapper.proccess(new_posts)
            console.log('Formatted posts:', formatted_posts)
            for (let post of formatted_posts) {
                let res = this.api.create_entry(post.title, post.text 
                        + '\nСозднано автоматически на основе: ' + post.url)
                if (res.err) {
                    console.log('Cant create post!:', res.err)
                } else {
                    console.log('Post', post, 'created')
                    this.new_post(post['md5'])
                }
            }
        }
    }
}

let vc_bot = new bot()
vc_bot.run()