'use strict'
const fs = require('fs')
const { VK: vk_io } = require('vk-io')
const request = require('request')
const cheerio = require('cheerio')
const axios = require('axios')

class vk {
    constructor() {
        this.ready = this.init()
        this.posts_count = 20
        this.comments_count = 10
    }

    async init() {
        const token = await this.get_token()

        return this.vk = new vk_io({ token })
    }

    async get_token () {
        return new Promise((resolve, reject) => {
            fs.readFile('apis/vk.config', 'utf8', (err, data) => {
                resolve(data)
            })
        })
    }
    
    map_comment(comment) {
        return ({
            id: comment.id,
            text: comment.text,
            likes: comment.likes,
            attachments: comment.attachments || [],
            date: comment.date,
        })
    }

    map_post(post, content, comment) {
        return ({
            url: this.get_post_url(post.owner_id, post.id),
            owner_id: post.owner_id,
            id: post.id,
            title: content && content.title || post.text,
            text: content && content.text || post.text,
            comments: comment && comment.items.map(this.map_comment) || [],
            attachments: post.attachments || [],
            date: post.date,
            likes: post.likes,
            reposts: post.reposts,
            views: post.views,
        })
    }

    async _get_posts (domain) {
        const posts = await this.fetch_posts(domain)
        const posts_comments = await this.get_posts_comments(posts)

        return this.prepare_posts(posts, null, posts_comments)
    }

    async fetch_posts (domain) {
        let start = await this.ready
        const posts = await this.vk.api.wall.get({ domain, count: this.posts_count })
        
        return posts.items.filter(this.check_ad)
    }

    async check_ad (post) {
        return !post.marked_as_ads
    }

    async get_posts () {
        // 'rbc' only
        return this.get_rbc_posts()
    }

    async get_rbc_posts () {
        const posts = await this.fetch_posts('rbc')
        const posts_contents = await this.get_rbc_posts_contents(posts)
        const posts_comments = await this.get_posts_comments(posts)
        
        return this.prepare_posts(posts, posts_contents, posts_comments)
    }

    prepare_posts (posts, contents, comments) {
        return posts
            .map((post, index) => this.map_post(
                post,
                contents && contents[index],
                comments && comments[index],
            ))
    }

    async get_rbc_post_content (url) {
        const post = await axios(url).then(
            (response) => {
                const $ = cheerio.load(response.data)

                return this.prepare_rbc_post_content($)
            },
            (err) => {
                console.error(err)

                return null
            } 
        )

        return post
    }

    prepare_rbc_post_content ($) {
        return ({
            title: this.get_post_title($),
            text: this.get_post_text($),
        })
    }

    get_post_title ($) {
        return $('.l-col-main:first-child .js-slide-title').text()
    }

    get_post_text ($) {
        const title = this.get_post_title($);
        const annotation = $('.l-col-main:first-child .article__text__overview span').text();
        const description = $('.l-col-main:first-child p').text()

        return [ title, annotation, description ]
            .reduce(
                (texts, text) => [
                    ...texts,
                    ...text && [ text ],
                ],
                [],
            )
            .join('. ')
    }

    async get_posts_comments (posts) {
        const comments = await Promise.all(
            posts.map(
                async (post) => {
                    return await this.vk.api.wall.getComments({
                        owner_id: post.owner_id,
                        post_id: post.id,
                        count: this.comments_count,
                        need_likes: true,
                    })
                },
            ),
        )

        return comments
    }

    async get_rbc_posts_contents (posts) {
        const posts_contents = await Promise.all(
            posts.map(
                async (post) => {
                    const link =
                        post.attachments &&
                        post.attachments
                            .find((attachment) => attachment.type === 'link')
                    const url = link && link.link.url

                    if (url) {
                        const post = await this.get_rbc_post_content(url)

                        return post
                    }

                    return null
                }
            )
        )

        return posts_contents
    }

    get_post_url (owner_id, post_id) {
        return `https://vk.com/rbc?w=wall${owner_id}_${post_id}`
    }
}

module.exports.get = () => {
    return new vk()
}