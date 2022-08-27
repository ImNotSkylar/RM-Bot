const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ActivityType } = require("discord.js")
const { prefix, token, categoryChannel } = require("../data/config.json");
const suid = require('short-unique-id');
const flags = PermissionsBitField.Flags;
const client = new Client({
    intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
})

client.squadrons = require('./squadrons.js');
client.generateId = new suid({ length: 6 });

function buildOptions(client) {
    let options = [];
    for (const squadron of client.squadrons) {
        let option = {
            label: squadron.name,
            description: squadron.description,
            value: squadron.name.toLowerCase().replace(/ /g, '_')
        };

        if (squadron.emoji) {
            option.emoji = squadron.emoji;
        }

        options.push(option);
    };

    return options;
}

client.once("ready", async () => {
    console.log(`${client.user.tag} | ${client.user.id} is online`)
    client.user.setActivity(`Royal Marines`, { type: ActivityType.Watching });
    console.log(`\nServers[${client.guilds.cache.size.toLocaleString()}]: \n---------\n${client.guilds.cache.map((guild) => `${guild.id + "\t" + guild.name + "   |   " + guild.memberCount.toLocaleString()} mem\'s`).join("\n")}`);

})

client.on("messageCreate", async (message) => {

    try {

        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/g),
            command = args.shift().toLowerCase();

        if (command === 'promote') {
            const member = client.users.cache.get(args[0]) || message.mentions.users.first()

            if (!args[0]) {
                return message.channel.send(`Please make sure to add a user id and or ping the user`)
            }

            if (!args[1]) {
                return message.channel.send(`Please add the role/rank they are being promoted to`)
            }

            message.delete()
            const promotionEmebed = new EmbedBuilder()
                .setDescription(`${member.tag} Was promoted to ${args[1]} by ${message.author.tag}`)
                .setColor("Green")
                .setTitle("__New Promotion__")
                .setFooter({ text: 'Bot made by ImNotSkylar#0107' })

            return message.channel.send({ embeds: [promotionEmebed] })
        }

        if (command === 'demote') {
            const member = client.users.cache.get(args[0]) || message.mentions.users.first()

            if (!args[0]) {
                return message.channel.send(`Please make sure to add a user id and or ping the user`)
            }

            if (!args[1]) {
                return message.channel.send(`Please add the role/rank they are being demoted to`)
            }

            message.delete()

            const demotionEmbed = new EmbedBuilder()
                .setDescription(`${member.tag} Was demoted to ${args[1]} by ${message.author.tag}`)
                .setColor("Red")
                .setTitle("__New Demotion__")
                .setFooter({ text: 'Bot made by ImNotSkylar#0107' })

            return message.channel.send({ embeds: [demotionEmbed] })
        }

        if (command === "tickets") {
            const embed = new EmbedBuilder()
                .setTitle("Open a Ticket")
                .setColor("Red")
                .setDescription("Select a Commando below to speak to its leadership")

            const tickets = new ActionRowBuilder()
                .addComponents(new SelectMenuBuilder()
                    .setCustomId('tickets-squadron')
                    .setPlaceholder('Select A Commando')
                    .addOptions(buildOptions(client)));

            await message.channel.send({
                embeds: [embed],
                components: [tickets]
            });
        }

    } catch (error) {
        console.log(error.stack)
        message.channel.send(`\`\`\`${error.stack}\`\`\``)
    };

    client.on('interactionCreate', async (interaction) => {
        if (interaction.isSelectMenu()) {
            let idParts = interaction.customId.split("-");
            if (idParts[0] === "tickets") {
                if (idParts[1] === "squadron") {

                    const catChannel = interaction.guild.channels.cache.get(categoryChannel);
                    const ticketCode = interaction.values[0].toLowerCase().split("_");

                    let squadCode = `${ticketCode[0]}`;
                    for (let i = 1; i < ticketCode.length; i++) {
                        squadCode += `${ticketCode[i][0]}`;
                        i++
                    };

                    let squadron = client.squadrons.find((squad) => squad.name.toLowerCase() === interaction.values[0].toLowerCase().replace(/_/g, " "));
                    const ticketId = client.generateId();

                    console.log(`${squadCode}-ticket${ticketId}`)

                    interaction.guild.channels.create({
                        name: `${squadCode}-ticket-${ticketId}`.toLowerCase(),
                        type: ChannelType.text,
                        parent: catChannel,
                        topic: `Ticket with ${interaction.member.displayName} & ${squadron.name} Leadership`,
                    }).then((channel) => {
                        channel.lockPermissions().then((channel) => {
                            channel.permissionOverwrites.edit(interaction.member.id, {
                                "ViewChannel": true,
                                "SendMessages": true,
                                "ReadMessageHistory": true,
                                "AttachFiles": true,
                                "EmbedLinks": true,

                            }).then((channel) => {
                                channel.permissionOverwrites.edit(squadron.role, {
                                    "ViewChannel": true,
                                    "SendMessages": true,
                                    "ReadMessageHistory": true,
                                    "AttachFiles": true,
                                    "EmbedLinks": true
                                }).then((channel) => {
                                    interaction.reply({
                                        content: `Your ticket has been created ${channel.toString()}`,
                                        ephemeral: true
                                    });

                                    const embed = new EmbedBuilder()
                                        .setTitle("Ticket Created!")
                                        .setDescription(`Thank you for contacting **${squadron.name}**. We will get back to you as soon as we can! please be patient as this may take a while.`)
                                        .setColor("Red")

                                    return channel.send({
                                        embeds: [embed],
                                        content: `${interaction.user.toString()} <@&${squadron.role}>`,
                                        components: [new ActionRowBuilder().addComponents(
                                            new ButtonBuilder()
                                                .setLabel("Close Ticket")
                                                .setStyle(ButtonStyle.Danger)
                                                .setCustomId(`closeTicket-${channel.id}`)
                                        )]
                                    })
                                }).catch((error) => {
                                    console.log(error.stack)
                                });
                            }).catch((error) => {
                                console.log(error.stack)
                            });
                        }).catch((error) => {
                            console.log(error.stack)
                        });
                    }).catch((error) => {
                        console.log(error.stack)
                        interaction.reply(`\`\`\`${error.stack}\`\`\``)
                    });
                }
            }

        } else if (interaction.isButton()) {
            const idParts = interaction.customId.split("-");
            if (idParts[0] === "closeTicket") {
                try {
                    const channel = interaction.guild.channels.cache.get(idParts[1]);
                    await interaction.reply({
                        content: `Ticket Closed. This channel will delete in **15 seconds**`
                    });
                    setTimeout(() => {
                        return channel.delete().catch((error) => {
                            //BLAHHH SLIENCE ERROR!!!!!! 
                        });

                    }, 15000);
                } catch (error) {
                    console.log(error.stack)
                    interaction.reply(`\`\`\`${error.stack}\`\`\``)
                }
            }
        }
    });
})

process.on('unhandledRejection', async error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(token)