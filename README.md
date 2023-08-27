# brick-hill-verifier

A node.js discord bot for verifying users in the Brick Hill discord. Made to work with Docker. \
Integrates nicely with AWS DynamoDB.

## Example:
![](https://cdn.discordapp.com/attachments/777386231410720798/777518339429105684/unknown.png)

## Setup:
1. Set the following environment variables: [`DISCORD_TOKEN`, `DISCORD_GUILD`].
2. Edit the bot prefix in `docker-compose.yml`.
3. Run `docker-compose up -d verifier`.
4. You are done!