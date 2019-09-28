'use strict'

const { VK: vk_io } = require('vk-io')

class vk {
    constructor() {
        // TODO: put in config
        this.vk = new vk_io({ token: 'fec36708fec36708fec3670824feae7a1effec3fec36708a34de6902b22244902f2d16b' });
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

    async get_posts () {
        // fetch posts
        const posts = await this.vk.api.wall.get({ domain: 'rbc', count: 10 });
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
}

module.exports.get = () => {
    return new vk()
}