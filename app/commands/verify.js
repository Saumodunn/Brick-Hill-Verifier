const crypto = require('crypto')
const Discord = require('discord.js')

const bot = require('../bot')
const dynamo = require('../database/dynamodb')
const brick_hill = require('../api/brick-hill')

const VERIFICATION_TIMEOUT_MINS = 2

function generateCode() {
    return 'bh-' + crypto.randomBytes(6).toString('hex')
}

async function checkBlurbCode(user) {
    const userData = await brick_hill.getUserData(user.userId)
    if (!userData || !userData.description) return
    
    return userData.description.includes(user.code)
}

function isWeekOld(joinDate) {
    const oneWeek = (1000 * 60 * 60 * 24) * 7;
    const oneWeekAgo = Date.now() - oneWeek;

    return joinDate <= oneWeekAgo
}

async function startVerifyProcess(msg, username) {
    if (bot.usersVerifying[msg.author.id]) 
        return msg.reply('You are currently verifying.')

    const verifyData = await dynamo.fetchUser(msg.author.id)
    if (verifyData) return msg.reply('You are already verified!')

    if (!isWeekOld(msg.author.createdAt))
        return msg.reply('Your Discord account must be older than 1 week to verify.')

    const [ id, err ] = await brick_hill.getIdFromUsername(username)
    if (err && err.message === 'Record not found') 
        return msg.reply('There is no user with that username.')
    if (!id) 
        return msg.reply('An error occurred while retrieving id.')

    const userData = await brick_hill.getUserData(id)

    const code = generateCode()

    const embed = new Discord.MessageEmbed()
        .setAuthor('Brick Hill Verifier', 'https://www.brick-hill.com/favicon.ico')
        .setColor('#fcfcfc')
        .setThumbnail(`https://brkcdn.com/images/avatars/${userData.img}.png`)
        .setDescription(
        `Hello, ${username}! :wave:\n` + 
        'Add the code below into your profile [blurb](https://www.brick-hill.com/settings/).\n\n' +
        `When you are finished, reply with \`${bot.prefix}done\` or \`${bot.prefix}cancel\`.`
        )

    await msg.channel.send(embed)
    await msg.channel.send(`\`\`\`${code}\`\`\``)

    let timer = setTimeout(() => {
        if (bot.usersVerifying[msg.author.id]) {
            delete bot.usersVerifying[msg.author.id]
            msg.reply('Ran out of time trying to verify. Please try again.')
        }
    }, 1000 * 60 * VERIFICATION_TIMEOUT_MINS)

    bot.usersVerifying[msg.author.id] = {
        userId: id,
        code: code,
        timer: timer
    }
}

module.exports = { startVerifyProcess, checkBlurbCode }
