'use strict'

const vk = require('./apis/vk')

const awesome_titles = ['Прекрасное краткое содержание!', 'Это важно!', 'Look at me', 'Дайджест',
                        'Новый пост', 'Важные новости']

let get_random_title = () => {
    let idx = Math.floor(Math.random() * awesome_titles.length)
    return awesome_titles[idx]
}

class sources {
    constructor() {
        this.vk = vk.get();
    }

    async get_posts () {
        let vk_posts = await this.vk.get_posts() 
        console.log(vk_posts)
        let approved_posts = vk_posts.filter((item) => { return item.text.length  > 500 })
        approved_posts = approved_posts.map((item) => { 
            if (item.title === item.text) {
                item.title = get_random_title()
            }
            return item
        })
        
        return approved_posts
    }
}

module.exports.get = () => {
    return new sources()
}