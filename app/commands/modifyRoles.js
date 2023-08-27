const bot = require('../bot')
const brick_hill = require('../api/brick-hill')

const BRICK_HILL_ROLES = [
    "Verified",
    "Classic",
    "Donator",
    "Beta User",
    "Brick Saint"
]

// Remove all roles from user.
async function remove(memberId) {
    const guild = bot.guilds.cache.get(process.env.DISCORD_GUILD);
    const guildMember = await guild.members.fetch({ user: memberId, force: true })
    if (!guildMember) return

    const roles = guild.roles.cache.filter(role => BRICK_HILL_ROLES.includes(role.name))

    return guildMember.roles.remove(roles, "Removed by Brick Hill verifier.")
}

// Check if guild member has role.
async function hasRole(memberId, roleName) {
    const guild = bot.guilds.cache.get(process.env.DISCORD_GUILD)
    const guildMember = await guild.members.fetch({ user: memberId, force: true })
    if (!guildMember) return

    return guild.roles.cache.some(role => role.name === roleName)
}

// Add roles to a user.
async function add(memberId, userId) {
    const guild = bot.guilds.cache.get(process.env.DISCORD_GUILD);
    const guildMember = await guild.members.fetch({ user: memberId, force: true })
    if (!guildMember) return

    let roles = [ guild.roles.cache.find(role => role.name === 'Verified') ]

    if (userId <= 108) roles.push(guild.roles.cache.find(role => role.name === 'Beta User'))

    const userData = await brick_hill.getUserData(userId)

    for (let award of userData.awards) {
        award = award.award
        if (BRICK_HILL_ROLES.includes(award.name))
            roles.push(guild.roles.cache.find(role => role.name === award.name))
    }

    await guildMember.setNickname(userData.username, "Set by Brick Hill Verifier.")
        .catch(() => {})

    return guildMember.roles.add(roles, "Added by Brick Hill Verifier.")
}

module.exports = { add, remove, hasRole }