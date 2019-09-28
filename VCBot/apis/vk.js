'use strict'

const { VK: vk_io } = require('vk-io')

class vk {
    constructor() {
      this.vk = new vk_io({ token: 'fec36708fec36708fec3670824feae7a1effec3fec36708a34de6902b22244902f2d16b' });
    }
    
    async get_posts () {
        const response = await this.vk.api.wall.get({ domain: 'rbc', count: 100 });

        return response
    }
}

module.exports.get = () => {
    return new vk()
}