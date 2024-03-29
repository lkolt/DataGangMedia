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

        this.communities = [ 'rbc', 'ria', 'space_live', 'deep_space' ]
    }

    async init() {
        const token = await this.get_token()

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

    map_post(community, post, content, comment, images) {
        return ({
            url: this.get_post_url(community, post.owner_id, post.id),
            images: images.length
                ? images
                : (
                    (content && content.image)
                        ? [ content.image ]
                        : []
                ),
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
        const posts_images = await this.get_posts_images(posts)
        
        return this.prepare_posts(community, posts, null, posts_comments, posts_images)
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
        try {
            const communities = await Promise.all(
                this.communities.map(async (community) => (
                    await this.get_community_posts(community)),
                ),
            )
            
            return communities.reduce(
                (communities, community) => [
                    ...communities,
                    ...community,
                ],
                [],
            )
        } catch (err) {
            console.error(err)

            return []
        }
    }

    async get_community_posts (community) {
        switch (community) {
            case 'rbc': {
                return await this.get_site_posts(
                    community,
                    {
                        title: '.l-col-main:first-child .js-slide-title',
                        image: {
                            selector: '.l-col-main:first-child .article__main-image img',
                            attr: 'src',
                        },
                        annotation: '.l-col-main:first-child .article__text__overview span',
                        description: '.l-col-main:first-child p',
                    },
                )
            }
            case 'ria': {
                return await this.get_site_posts(
                    community,
                    {
                        title: '.layout-article__main:first-child .article__title:first-child',
                        image: {
                            selector: '[property="og:image"]',
                            attr: 'content',
                        },
                        annotation: false,
                        description: '.layout-article__main:first-child .article__body .article__text',
                    },
                )
            }
            default: {
                return await this._get_posts(community)
            }
        }
    }

    async get_site_posts (community, selectors) {
        const posts = await this.fetch_posts(community)
        const posts_contents = await this.get_posts_contents(posts, selectors)
        const posts_comments = await this.get_posts_comments(posts)
        const posts_images = await this.get_posts_images(posts)
        
        return this.prepare_posts(community, posts, posts_contents, posts_comments, posts_images)
    }

    prepare_posts (community, posts, contents, comments, images) {
        return posts
            .map((post, index) => this.map_post(
                community,
                post,
                contents && contents[index],
                comments && comments[index],
                images && images[index],
            ))
    }

    async get_post_content (url, selectors) {
        const post = await axios(url).then(
            (response) => {
                const $ = cheerio.load(response.data)

                return this.prepare_post_content($, selectors)
            },
            (err) => {
                console.error(err)

                return null
            } 
        )

        return post
    }

    prepare_post_content ($, { title, image, annotation, description }) {
        return {
            title: this.get_post_title($, title),
            text: this.get_post_text($, { title, annotation, description }),
            image: this.get_post_image($, image),
        }
    }

    get_post_title ($, title) {
        return title && $(title).text()
    }

    get_post_image ($, image) {
        return image.selector && image.attr && $(image.selector).attr(image.attr)
    }

    get_post_text ($, selectors) {
        const title = selectors.title && this.get_post_title($, selectors.title)
        const annotation = selectors.annotation && $(selectors.annotation).text()
        const description = selectors.description && $(selectors.description).text()

        return [ title, annotation, description ]
            .reduce(
                (texts, text) => [
                    ...texts,
                    ...!!text ? [ text ] : [],
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

    async get_posts_images (posts) {
        const images = await Promise.all(
            posts.map(
                async (post) => {
                    const images = (
                        post.attachments &&
                        post.attachments.filter((attachment) => attachment.type === 'photo')
                    )
                    
                    if (images && images.length) {
                        const photos = await this.vk.api.photos.getById({
                            photos: images.map((image) => (
                                [ post.owner_id, image.photo.id, image.photo.access_key ].reduce(
                                    (paths, path) => [
                                        ...paths,
                                        ...!!path ? [ path ] : [],
                                    ],
                                    [],
                                ).join('_')
                            )).join(','),
                            extended: 0,
                        })    
                    
                        if (photos.length) {
                            const urls = photos.map(
                                (photo) => photo.sizes.find((size) => size.type === 'x').url,
                            )
                            
                            return urls
                        }
                    }

                    return []
                },
            )
        )

        return images
    }

    async get_posts_contents (posts, selectors) {
        const posts_contents = await Promise.all(
            posts.map(
                async (post) => {
                    const link =
                        post.attachments &&
                        post.attachments
                            .find((attachment) => attachment.type === 'link')
                    const url = link && link.link.url

                    if (url) {
                        const post = await this.get_post_content(url, selectors)

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
