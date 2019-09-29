'use strict'
const md5 = require('md5')
const fs = require('fs')

const VCAPI = require('./VCAPI')
const sources = require('./sources')
const ml_wrapper = require('./ml_wrapper')

const url_vc = 'https://api.vc.ru/v1.8/'
const min_posts_for_dijest = 3

const all_comments = ['Осуждаю', 'Ну это уже слишком!', 'Что тут еще сказать...', 'Как это вообще сюда попало?!']
const tematic_comments = {
    'Техника': ['Ммм.. У нас на матмехе такого не рассказывали', 'Что-то сложно, кто расскажет легче?'],
    'Право': ['Опять политика...', 'Это тот VC.ru, что я люблю!'],
    'Маркетинг': ['Я не буду ничего у вас покупать!'],
    'Финансы': ['Уже пора вкладываться в биткоин??', 'Продам гараж!']
}

let need_comment = () => {
    let rand = Math.random()
    console.log('Rand:', rand)
    return rand > 0.75
}

let take_comment = function (cat) {
    if (!tematic_comments[cat]) {
        return get_random_comment(all_comments)
    }
    return get_random_comment(Math.random < 0.75 ? all_comments : tematic_comments[cat])
}

let get_random_comment = (comments) => {
    let idx = Math.floor(Math.random() * comments.length)
    return comments[idx]
}

class bot {
    constructor () {
        this.api = VCAPI.get(url_vc)
        this.sources = sources.get()
        this.wrapper = ml_wrapper.get()
        this.new_hashes = []
        this.dijest = []
        this.idx = 0
        this.get_posted = this.get_already_posted()
        this.get_posts()
        setInterval(this.get_posts.bind(this), 1000 * 60 * 30)
        setInterval(this.run.bind(this), 1000 * 60 * 5)
    }

    async get_posts () {
        console.log('Getting posts!')
        this.idx = 0
        this.posts = this.sources.get_posts()
    }
    
    async get_post () {
        let posts = await this.posts
        let already = await this.get_posted
        // console.log(already)
        while (this.idx < posts.length) {
            let post = posts[this.idx++]
            post['md5'] = md5(post['title'])
            this.idx++
            if (!already.includes(post['md5']) && !this.new_hashes.includes(post['md5'])){
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
        console.log('Try to post entry')
        let new_posts = await this.get_post()
        console.log('New post:', new_posts)
        if (new_posts.length) {
            let formatted_posts = await this.wrapper.proccess(new_posts)
            console.log('Formatted posts:', formatted_posts.length)
            for (let post of formatted_posts) {
                if (post.text[post.text.length - 1] != '.') {
                    post.text += '.'
                }
                if (post.class != 'Офтоп') {
                    if (!this.dijest[post.class]) {
                        this.dijest[post.class] = []
                    }
                    this.dijest[post.class].push({
                        text: post.text, 
                        url: post.url
                    })
                    if (this.dijest[post.class].length >= min_posts_for_dijest) {
                        let title = 'Дайджест по теме ' + post.class + ' за последние пару часов!'
                        let text = 'Наш автодайжест уже с вами! Сортируем темы по актуальности специально для вас.\n'
                        let idx = 0
                        for (let item of this.dijest[post.class]) {
                            idx++
                            text += idx + ') ' + item.text + '\n'
                            text += `Полная статья: <a href="${item.url}" target="_blank">${item.url}</a>\n\n`
                        }
                        let res = await this.api.create_entry(title, text, [])
                        
                        if (res.err) {
                            console.log('Cant create post!:', res.err)
                        } else {
                            console.log('Dijest', 'created')
                            this.api.create_comment(res.data.result.id, 'Вам нравятся посты по тематике ' + 
                                post.class.toLocaleLowerCase() + '? Ставьте ваши плюсы!', 0, [])
                        }
                        this.dijest[post.class] = []
                    } else {
                        let res = await this.api.create_entry(
                            post.title,
                            (
                                post.text +
                                (post.url
                                    ? `\nСоздано автоматически на основе: <a href="${post.url}" target="_blank">${post.url}</a>`
                                    : '')
                            ),
                            post.images,
                        )
                        if (res.err) {
                            console.log('Cant create post!:', res.err)
                        } else {
                            console.log('Post', post, 'created')
                            this.new_post(post['md5'])
                            this.new_hashes.push(post['md5'])
                            if (need_comment()) {
                                console.log('Posting comment...')
                                let comment = take_comment(post.class)
                                console.log('Comment:', comment)
                                this.api.create_comment(res.data.result.id, comment, 0, [])
                            }
                        }
                    }
                    console.log(this.dijest)
                } else {
                    console.log('This post is offtop!!')
                    this.new_post(post['md5'])
                    this.new_hashes.push(post['md5'])
                }
            }
        }
    }
}

let vc_bot = new bot()
vc_bot.run()
