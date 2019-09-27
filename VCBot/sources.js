'use strict'

const vk = require('./apis/vk')

class sources {
    constructor() {
        this.vk = vk.get();
    }

    get_posts () {
        return [{
            title: 'Awesome!',
            text: 'Wow!',
        }]
    }

    async get_vk_posts () {
        const posts = await this.vk.get_posts() 

        return posts
    }
}

module.exports.get = () => {
    return new sources()
}