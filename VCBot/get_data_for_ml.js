
const api = require('./VCAPI').get('https://api.vc.ru/v1.8/')
let init = async () => {
    let res = await api.get_request('timeline/mainpage/popular')
    fs.writeFile('data.json', JSON.stringify(res.data), () => {
        console.log('Done!')
    })
}
init()