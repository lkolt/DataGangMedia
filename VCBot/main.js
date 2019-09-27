'use strict'

const VCAPI = require('./VCAPI')
const sources = require('./sources')
const ml_wrapper = require('./ml_wrapper')

const url_vc = 'https://api.vc.ru/v1.8/'

class bot {
    constructor () {
        this.api = VCAPI.get(url_vc)
        this.sources = sources.get()
        this.wrapper = ml_wrapper.get()
    }

    async run () {
        const vk_posts = await this.sources.get_vk_posts();
        
        console.log('test', vk_posts);
        let posts = this.sources.get_posts()
        let formatted_posts = this.wrapper.proccess(posts)
        for (let post of formatted_posts) {
            let res = this.api.create_entry(post.title, post.text)
            if (res.err) {
                console.log('Cant create post!:', res.err)
            } else {
                console.log('Post', post, 'created')
            }
        }
    }
}

let vc_bot = new bot()
vc_bot.run()