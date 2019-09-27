'use strict'

class sources {
    get_posts () {
        return [{
            title: 'Awesome!',
            text: 'Wow!',
        }]
    }
}

module.exports.get = () => {
    return new sources()
}