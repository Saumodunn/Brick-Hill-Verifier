const Discord = require('discord.js')
const dynamo = require('./database/dynamodb')

const VALID_USERNAME = RegExp(/^[a-zA-Z0-9\-.\_ ]{1,26}$/)

const bot = new Discord.Client()
    bot.usersVerifying = {}
    bot.rateLimit = new Set()
    bot.prefix = process.env.PREFIX;

module.exports = bot

const verify = require('./commands/verify')
const modifyRoles = require('./commands/modifyRoles')
const { lookup } = require('./commands/lookup')

function rateLimited(msg) {
    const id = msg.author.id
    if (bot.rateLimit.has(id)) {
        msg.reply('You are sending commands too fast! Please wait 5 seconds.')
        return true
    }
    bot.rateLimit.add(id)
    setTimeout(() => bot.rateLimit.delete(id), 5000)
}

bot.on('message', async msg => {
    if (!msg || !msg.author || msg.author.bot) return
    if (msg.channel.type !== 'dm') return

    if (!msg.content.startsWith(bot.prefix)) return

    const args = msg.content.slice(bot.prefix.length).trim().split(' ')
    const command = args.shift().toLowerCase()

    switch(command) {
        case 'verify': {
            const username = args.join(' ')
            if (!username.length) return msg.reply('You must provide a username!')
            if (rateLimited(msg)) return
            if (!VALID_USERNAME.test(username)) return msg.reply("Don't try to hurt me :woozy_face: (use a valid username).")

            return verify.startVerifyProcess(msg, username).catch((err) => {
                console.error(err)
                delete bot.usersVerifying[msg.author.id]
                msg.reply('An error occurred during the verification process. Please try again later.')
            })
        }
        case 'lookup': {
            if (!await modifyRoles.hasRole(msg.author.id, 'Staff')) 
                return msg.reply('This command can only be used by staff.')

            const discordId = args.join(' ')
            
            if (!/^\d+$/.test(discordId)) return msg.reply('Must provide a valid discord id.')

            return lookup(msg, discordId).catch((err) => {
                console.error(err)
                msg.reply('Error occurred while looking up account information.')
            })
        }
        case 'unverify': {
            if (bot.usersVerifying[msg.author.id]) return msg.reply('You are currently verifying.')
            if (rateLimited(msg)) return

            const verifyData = await dynamo.fetchUser(msg.author.id)
            if (!verifyData) return msg.reply('You are not verified.')

            await modifyRoles.remove(msg.author.id)
                .catch((err) => {
                    console.error(err)
                    msg.reply('An error occurred while unverifying you.')
                })

            return dynamo.deleteVerifiedUser(msg.author.id)
                .then(() => msg.reply('Successfully unverified you.'))
                .catch(() => msg.reply('An error occurred while unverifying you.'))
        }
        case 'done': {
            const user = bot.usersVerifying[msg.author.id]
            if (!user || rateLimited(msg)) return
            try {
                const match = await verify.checkBlurbCode(user)
                if (!match) return msg.reply('Code does not match. Try again.')
                await modifyRoles.add(msg.author.id, user.userId)
                await dynamo.setUserVerified(msg.author.id, user.userId)
                console.log('Successfully verified user: ' + msg.author.id)
                msg.reply('You have been successfully verified! You can now remove the code from your blurb.')
            } catch (err) {
                console.error(err)
                console.log('Error verifying user: ' + msg.author.id)
                msg.reply('An error occurred during the verification process. Please try again later.')
            }
            return delete bot.usersVerifying[msg.author.id]
        }
        case 'cancel': {
            const user = bot.usersVerifying[msg.author.id]
            if (!user) return
            clearTimeout(user.timer)
            delete bot.usersVerifying[msg.author.id]
            return msg.reply('Verification process has been aborted.')
        }
        case 'roles': {
            if (rateLimited(msg)) return

            const verifyData = await dynamo.fetchUser(msg.author.id)
            if (!verifyData) return msg.reply('You are not verified.')

            return modifyRoles.add(msg.author.id, verifyData.userId)
                .then(() => msg.reply('Successfully set your roles.'))
                .catch((err) => {
                    console.error(err)
                    msg.reply('An error occurred while setting your roles')
                })
        }
        case 'help': {
            return msg.reply('Commands: `!verify`, `!unverify`, `!roles`.')
        }
    }
})

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);

    bot.user.setActivity('DM me !help', { type: 'WATCHING' })
})

bot.on('error', console.error)

bot.login()
