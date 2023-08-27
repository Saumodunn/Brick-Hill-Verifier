const AWS = require('aws-sdk')

AWS.config.update({
    region: 'us-east-1',
    endpoint: 'http://dynamodb.us-east-1.amazonaws.com'
})

const docClient = new AWS.DynamoDB.DocumentClient()

async function fetchUser(discordId) {
    const params = {
        TableName: 'verified',
        Key: {
            'discordId': discordId
        }
    }
    let data = await docClient.get(params).promise()
    return data.Item
}

async function setUserVerified(discordId, userId) {
    const params = {
        TableName: 'verified',
        Item: {
            'discordId': discordId,
            'userId': userId,
            'verified': true
        }
    }
    return docClient.put(params).promise()
}

async function deleteVerifiedUser(discordId) {
    const params = {
        TableName: 'verified',
        Key: {
            'discordId': discordId
        }
    }
    return docClient.delete(params).promise()
}

module.exports = { fetchUser, setUserVerified, deleteVerifiedUser }