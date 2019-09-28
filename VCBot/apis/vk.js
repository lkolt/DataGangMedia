'use strict'
const fs = require('fs')
const { VK: vk_io } = require('vk-io')

class vk {
    constructor() {
        this.ready = this.init()
    }

    async init() {
        let token = await this.get_token()
        this.vk = new vk_io({ token: token })
    }

    async get_token () {
        return new Promise((resolve, reject) => {
            fs.readFile('apis/vk.config', 'utf8', (err, data) => {
                resolve(data)
            })
        })
    }
    
    mapComment(comment) {
        return ({
            id: comment.id,
            text: comment.text,
            likes: comment.likes,
            attachments: comment.attachments || [],
            date: comment.date,
        })
    }

    mapPost(post, comments) {
        return ({
            owner_id: post.owner_id,
            id: post.id,
            text: post.text,
            comments: comments
                .find((comments) => (
                    comments.owner_id === post.owner_id &&
                    comments.post_id === post.id
                ))
                    .items.map(this.mapComment),
            attachments: post.attachments || [],
            date: post.date,
            likes: post.likes,
            reposts: post.reposts,
            views: post.views,
        })
    }

    async _get_posts (domain) {
        // fetch posts
        let start = await this.ready
        const posts = await this.vk.api.wall.get({ domain: domain, count: 10 });
        // fetch comments
        const comments = await Promise.all(
            posts.items.map(
                async (item) => {
                    return await this.vk.api.wall.getComments({
                        owner_id: item.owner_id,
                        post_id: item.id,
                        count: 10,
                        need_likes: true,
                    })
                        .then((comments) => ({
                            ...comments,
                            owner_id: item.owner_id,
                            post_id: item.id,
                        }))
                },
            ),
        )
        // map comments to posts
        const result = posts.items
            .map((post) => this.mapPost(post, comments))
        
        return result
    }

    async get_posts () {
        // 'ria', 'rbk'
        return this._get_posts('probizportal')
    }
}

module.exports.get = () => {
    return new vk()
}