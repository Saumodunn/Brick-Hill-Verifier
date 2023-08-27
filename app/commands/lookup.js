const dynamo = require('../database/dynamodb')

async function lookup(msg, discordId) {
    await msg.reply(`:mag_right: Looking up verified information for: ${discordId} ...`)

    const verifiedUser = await dynamo.fetchUser(discordId)

    if (!verifiedUser) return msg.reply(':x: No verified user found for: ' + discordId)

    msg.reply(`Found user: \nhttps://www.brick-hill.com/user/${verifiedUser.userId}/`)
}

module.exports = { lookup }