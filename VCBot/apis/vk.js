'use strict'
const fs = require('fs')
const { VK: vk_io } = require('vk-io')
const request = require('request')
const cheerio = require('cheerio')
const axios = require('axios')

class vk {
    constructor() {
        this.ready = this.init()

        this.posts_count = 5
        this.comments_count = 2

        this.communities = [ 'rbc', 'bizness_online', 'reklamamarketing' ]
    }

    async init() {
        const token = await this.get_token()
	console.log(token)
        return this.vk = new vk_io({ token })
    }

    async get_token () {
        return new Promise((resolve, reject) => {
            fs.readFile('apis/vk.config', 'utf8', (err, data) => {
                resolve(data.replace(' ', '').replace('\n', ''))
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

    map_post(community, post, content, comment) {
        return ({
            url: this.get_post_url(community, post.owner_id, post.id),
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

    async _get_posts (community) {
        const posts = await this.fetch_posts(community)
        const posts_comments = await this.get_posts_comments(posts)

        return this.prepare_posts(community, posts, null, posts_comments)
    }

    async fetch_posts (community) {
        let start = await this.ready
        
        try {
            const posts = await this.vk.api.wall.get({ domain: community, count: this.posts_count })
            
            return posts.items.filter(this.check_ad)
        } catch (err) {
            console.error(err)

            return []
        }
    }

    async check_ad (post) {
        return !post.marked_as_ads
    }

    async get_posts () {
        console.log('Entry to get posts')
        const communities = await Promise.all(
            this.communities.map(async (community) => (
                await this.get_community_posts(community)),
            ),
        )
        console.log(communities)
        
        return communities.reduce(
            (communities, community) => [
                ...communities,
                ...community,
            ],
            [],
        )
    }

    async get_community_posts (community) {
        switch (community) {
            case 'rbc': {
                return await this.get_rbc_posts(community)
            }
            default: {
                return await this._get_posts(community)
            }
        }
    }

    async get_rbc_posts (community) {
        const posts = await this.fetch_posts(community)
        const posts_contents = await this.get_rbc_posts_contents(posts)
        const posts_comments = await this.get_posts_comments(posts)
        
        return this.prepare_posts(community, posts, posts_contents, posts_comments)
    }

    prepare_posts (community, posts, contents, comments) {
        return posts
            .map((post, index) => this.map_post(
                community,
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

    get_post_url (community, owner_id, post_id) {
        return `https://vk.com/${community}?w=wall${owner_id}_${post_id}`
    }
}

module.exports.get = () => {
    return new vk()
}
