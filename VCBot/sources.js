'use strict'

const vk = require('./apis/vk')
const emojiRegex = require('emoji-regex')
const regex = emojiRegex()

const awesome_titles = ['Прекрасное краткое содержание!', 'Это важно!', 'Look at me', 'Дайджест',
                        'Новый пост', 'Важные новости']

let get_random_title = () => {
    let idx = Math.floor(Math.random() * awesome_titles.length)
    return awesome_titles[idx]
}

const stop_words = ['получи', 'пройди', 'пройдите', 'попробуй', 'выбирай', 'оставь', 'регистрируйся']

let check_stop_words = (text) => {
    for (let stop_word of stop_words) {
        if (text.includes(stop_word)) {
            return true
        }
    }

    return false
}

class sources {
    constructor() {
        this.vk = vk.get();
    }

    async get_posts () {
        let vk_posts = await this.vk.get_posts() 
        console.log('Get vk posts:', vk_posts.length)

        let approved_posts = vk_posts.filter((item) => { 
            let preproc = item.text.replace(' ', '').toLocaleLowerCase()
            return  preproc.length  > 500 && 
                    !check_stop_words(preproc) &&
                    !regex.exec(preproc)
        })
        console.log('Get approved posts:', approved_posts.length)
        approved_posts = approved_posts.map((item) => { 
            if (item.title === item.text) {
                item.title = item.text.split('.')[0].split('\n')[0].split(' ').slice(0, 6).join(' ')
            }
            return item
        })
        
        return approved_posts
    }
}

module.exports.get = () => {
    return new sources()
}