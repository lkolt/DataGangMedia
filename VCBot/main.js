'use strict'

const VCAPI = require('VCAPI')
const url_vc = 'https://api.vc.ru/v1.8/'

class bot {
    constructor () {
        this.api = VCAPI.get_api(url_vc)
    }
}