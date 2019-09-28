'use strict'

const vk = require('./apis/vk')

class sources {
    constructor() {
        this.vk = vk.get();
    }

    async get_posts () {
        let vk_posts = await this.vk.get_posts() 
        // console.log(vk_posts)
        let approved_posts = vk_posts.filter((item) => { return item.text.length  > 500 })
        approved_posts = approved_posts.map((item) => { 
            item.title = 'Прекрасное краткое содержание!'
            return item
        })
        
        return approved_posts
    }
}

module.exports.get = () => {
    return new sources()
}