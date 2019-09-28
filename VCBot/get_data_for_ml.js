const fs = require('fs')

const api = require('./VCAPI').get('https://api.vc.ru/v1.8/')

let init = async () => {
    let res = await api.get_request('timeline/index/month')
    fs.writeFile('data_index_month.json', JSON.stringify(res.data), () => {
        console.log('Done!')
    })
}

init()