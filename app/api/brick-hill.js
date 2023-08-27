const phin = require('phin')
    .defaults({ parse: 'json', timeout: 12000 })

const USERNAME_API = 'https://api.brick-hill.com/v1/user/id?username='

const PROFILE_API = 'https://api.brick-hill.com/v1/user/profile?id='

async function getIdFromUsername(username) {
    try {
        const data = (await phin({url: USERNAME_API + username})).body
        return [ data.id, data.error ]
    } catch (err) {
        return [ false, false ]
    }
}

async function getUserData(userId) {
    try {
        const data = (await phin({url: PROFILE_API + userId})).body
        return data
    } catch (err) {}
}

module.exports = { getIdFromUsername, getUserData }