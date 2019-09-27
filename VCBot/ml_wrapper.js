'use strict'

class wrapper {
    proccess (posts) {
        return posts
    }
}

module.exports.get = () => {
    return new wrapper()
}