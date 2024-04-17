const Discord = require(`discord.js`);
const db = require(`quick.db`);
const client = new Discord.Client({ intents: [new Discord.Intents().add(32767)] });
const config = require(`./config.json`);

const InvitesTracker = require('@androz2091/discord-invites-tracker');
const tracker = InvitesTracker.init(client, {
    fetchGuilds: true,
    fetchVanity: true,
    fetchAuditLogs: true
});

client.on(`ready`, () => {
    console.log(`Logged Us : ${client.user.tag}`)
});

client.on("inviteLogger", (member, invite, inviter) => {
    console.log(inviter)
    db.add(`user_${inviter.id}`, 1);
})

tracker.on('guildMemberAdd', (member, type, invite) => {
    if(type === 'normal'){
      db.add(`user_${invite.inviter.id}`, 1);
    }

});


client.on(`messageCreate`, async smithmsg => {
    if (!smithmsg.content.startsWith(config.prefix)) return;

    const args = smithmsg.content.slice(config.prefix.length).trim().split(` `)
    const command = args.shift().toLowerCase();
    const mention = smithmsg.mentions.users.first() || client.users.cache.get(args[0])



    if (command === `mypoint`) {
        var point = db.get(`user_${smithmsg.author.id}`) || 0;

        if (!point || point === 0) return smithmsg.reply({ content: `You don't have any point!` });

        smithmsg.reply({ content: `You have **${point}** points !` })
    } else if (command === `spin`) {
        if (!smithmsg.channel.name.startsWith(`ticket`)) return smithmsg.reply({ content: `this command enable only in ticket !` });

        var smith_embed = new Discord.MessageEmbed()
            .setAuthor({ name: smithmsg.author.tag, iconURL: smithmsg.author.avatarURL() })
            .setTitle(smithmsg.guild.name + ` luck spin`)
            .setDescription(`Normal spin\nYou need one point to use one spin\nLegend spin\nYou need 2 point to use one spin`)
            .setTimestamp()
            .setFooter({ text: smithmsg.guild.name, iconURL: smithmsg.guild.iconURL() });

        var normal_spin_button = new Discord.MessageButton()
            .setStyle(`SUCCESS`)
            .setLabel(`Normal Spin`)
            .setCustomId(`normal_spin`);

        var legend_spin_button = new Discord.MessageButton()
            .setStyle(`SUCCESS`)
            .setLabel(`Legend Spin`)
            .setCustomId(`legend_spin`);

        var close_spin_button = new Discord.MessageButton()
            .setStyle(`DANGER`)
            .setLabel(`Close`)
            .setCustomId(`close_spin`);

        var all_button = new Discord.MessageActionRow()
            .addComponents(normal_spin_button)
            .addComponents(legend_spin_button)
            .addComponents(close_spin_button);

        smithmsg.channel.send({ embeds: [smith_embed], components: [all_button] }).then(msg => {
            const filter = i => i.customId.endsWith(`_spin`) && i.user.id === smithmsg.author.id;

            const collector = smithmsg.channel.createMessageComponentCollector({ filter });

            collector.on('collect', async i => {
                if (i.customId === 'close_spin') {
                    await msg.delete().catch(err => { })
                    await smithmsg.delete().catch(err => { })
                } else if (i.customId === 'normal_spin') {
                    var point = db.get(`user_${smithmsg.author.id}`);

                    if (Number(point) < 1) return i.update({ content: `You need to 1 point to spin !`  , embeds: [], components: [] }).catch(err => {});
                    

                    const randomSpin = config.spin_default[Math.floor(Math.random() * config.spin_default.length)];

                    smithmsg.channel.send({ content: `الرجاء عدم المنشن وانتظار تسليمك لقد قمنا بعمل منشن من اجلك\nالشخص المستلم  : ${smithmsg.author}\nالجائزة : **${randomSpin}**`}).catch(err => {});
                    smithmsg.channel.setName(`${randomSpin}`).catch(err => {});
                    db.add(`user_${smithmsg.author.id}` , -1);
                } else if (i.customId === 'legend_spin') {
                    var point = db.get(`user_${smithmsg.author.id}`);

                    if (Number(point) < 2) return i.update({ content: `You need to 2 point to spin !`  , embeds: [] , components: []}).catch(err => {});
            
                    const randomSpin = config.spin_legends[Math.floor(Math.random() * config.spin_legends.length)];

                    smithmsg.channel.send({ content: `** الرجاء عدم المنشن وانتظار تسليمك لقد قمنا بعمل منشن من اجلك\nالشخص المستلم  : ${smithmsg.author}\nالجائزة : ${randomSpin}**`}).catch(err => {});
                    smithmsg.channel.setName(`${randomSpin}`).catch(err => {})
                    db.add(`user_${smithmsg.author.id}` , -2);
                } 
            });
        })

    } else if (command === `addpoint`) {
        if (!smithmsg.member.permissions.has(`ADMINISTRATOR`)) return;
        if (!args[1] || !mention || isNaN(args[1])) return smithmsg.reply({content: `Please insert valid number (${config.prefix}${command} <user> <value>)`});

        db.add(`user_${mention.id}` , Number(args[1]))

        var embed_smith_2 = new Discord.MessageEmbed()
        .setAuthor({name: mention.tag , iconURL: mention.avatarURL()})
        .setDescription(`successfully added **${Number(args[1])}** to ${mention}\nTotal Point of ${mention.tag}: **${db.get(`user_${mention.id}`)}**`)
        .setColor(`GREEN`);

        smithmsg.reply({embeds: [embed_smith_2]})
    } else if (command === `clearpoint`) {
        if (!smithmsg.member.permissions.has(`ADMINISTRATOR`)) return;
        
        var allUser = db.all();
        let i = 0;

        allUser.forEach(user => {
            db.delete(user.ID)
            i++
        })

        var embed_smith_2 = new Discord.MessageEmbed()
        .setAuthor({name: smithmsg.author.tag , iconURL: smithmsg.author.avatarURL()})
        .setDescription(`all point successfully deleted for **${i}** user's.`)
        .setColor(`GREEN`);

        smithmsg.reply({embeds: [embed_smith_2]})
    } else if (command === `help`) {
        if (!smithmsg.member.permissions.has(`ADMINISTRATOR`)) return;

        

        var embed_smith_2 = new Discord.MessageEmbed()
        .setFooter({text:`Requested By ` + smithmsg.author.tag , iconURL: smithmsg.author.avatarURL()})
        .setAuthor({ name: smithmsg.guild.name + ` Spin Help`, iconURL: smithmsg.guild.iconURL() })
        .addField(`Bot Command`,`\`mypoint\` to show your current point.\n\`spin\` to spin and get your prize.\n\`addpoint\` to add point to some one.\n\`clearpoint\` to clear all member point.\n`,true)
        .addField(`Bot Ping`,`${client.ws.ping}ms`,true)
        .setColor(`GREEN`);

        smithmsg.reply({embeds: [embed_smith_2]})
    }


})



client.login(config.token);