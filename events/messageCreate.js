import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, '..', 'config.json'), 'utf-8'));

export default async (client, message) => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    console.log(`Received command: ${command}`); // Debug log to check command parsing

    const channelData = Array.from(client.tempChannels.entries())
        .find(([_, data]) => data.owner === message.author.id);

    if (!channelData) {
        return message.reply("You don't own any voice channels!");
    }

    const [channelId, data] = channelData;
    const voiceChannel = message.guild.channels.cache.get(channelId);

    if (!voiceChannel) {
        return message.reply("Your voice channel could not be found.");
    }

    switch (command) {
        case 'lock':
        case 'vlock':
            await voiceChannel.permissionOverwrites.edit(message.guild.id, {
                Connect: false
            });
            client.tempChannels.set(channelId, { ...data, locked: true });
            message.reply('Room locked! 🔒');
            break;

        case 'unlock':
        case 'vunlock':
            await voiceChannel.permissionOverwrites.edit(message.guild.id, {
                Connect: null
            });
            client.tempChannels.set(channelId, { ...data, locked: false });
            message.reply('Room unlocked! 🔓');
            break;

        case 'rename':
        case 'vrename':
            const newName = args.join(' ');
            if (!newName) return message.reply('Please provide a new name!');
            
            await voiceChannel.setName(`🎧│${newName}`);
            message.reply(`Channel renamed to: ${newName}`);
            break;

        case 'invite':
        case 'vinvite':
            const userToInvite = message.mentions.members.first();
            if (!userToInvite) return message.reply('Please mention a user to invite!');
            
            await voiceChannel.permissionOverwrites.edit(userToInvite.id, {
                Connect: true,
                ViewChannel: true
            });
            message.reply(`Invited ${userToInvite} to the voice channel!`);
            break;

        case 'kick':
        case 'vkick':
            const userToKick = message.mentions.members.first();
            if (!userToKick) return message.reply('Please mention a user to kick!');
            
            if (userToKick.voice.channelId === channelId) {
                await userToKick.voice.disconnect();
                await voiceChannel.permissionOverwrites.edit(userToKick.id, {
                    Connect: false
                });
                message.reply(`Kicked ${userToKick} from the voice channel!`);
            } else {
                message.reply('That user is not in your voice channel!');
            }
            break;

        case 'mute':
        case 'vmute':
            const userToMute = message.mentions.members.first();
            if (!userToMute) return message.reply('Please mention a user to mute!');
            if (userToMute.voice.channelId !== channelId) return message.reply('User is not in your voice channel!');
            await userToMute.voice.setMute(true);
            message.reply(`Muted ${userToMute} in your voice channel! 🔇`);
            break;

        case 'unmute':
        case 'vunmute':
            const userToUnmute = message.mentions.members.first();
            if (!userToUnmute) return message.reply('Please mention a user to unmute!');
            if (userToUnmute.voice.channelId !== channelId) return message.reply('User is not in your voice channel!');
            await userToUnmute.voice.setMute(false);
            message.reply(`Unmuted ${userToUnmute} in your voice channel! 🔊`);
            break;

        case 'ban':
        case 'vban':
            const userToBan = message.mentions.members.first();
            if (!userToBan) return message.reply('Please mention a user to ban!');
            if (userToBan.voice.channelId !== channelId) return message.reply('User is not in your voice channel!');
            await voiceChannel.permissionOverwrites.edit(userToBan.id, {
                Connect: false,
                Speak: false,
                ViewChannel: false
            });
            await userToBan.voice.disconnect();
            message.reply(`Banned ${userToBan} from your voice channel! ⛔`);
            break;

        case 'unban':
        case 'vunban':
            const userToUnban = message.mentions.members.first();
            if (!userToUnban) return message.reply('Please mention a user to unban!');
            await voiceChannel.permissionOverwrites.delete(userToUnban.id);
            message.reply(`Unbanned ${userToUnban} from your voice channel! ✅`);
            break;

        case 'limit':
        case 'vlimit':
            const limit = parseInt(args[0]);
            if (isNaN(limit)) return message.reply('Please provide a valid number!');
            await voiceChannel.setUserLimit(limit);
            message.reply(`Set user limit to ${limit} 👥`);
            break;

        case 'bitrate':
        case 'vbitrate':
            const bitrate = parseInt(args[0]);
            if (isNaN(bitrate)) return message.reply('Please provide a valid number (8-96)!');
            await voiceChannel.setBitrate(bitrate * 1000);
            message.reply(`Set bitrate to ${bitrate}kbps 🎵`);
            break;

        case 'muteall':
        case 'vmuteall':
            for (const member of voiceChannel.members.values()) {
                if (member.id !== message.author.id) {
                    await member.voice.setMute(true);
                }
            }
            message.reply('Muted all users in your channel! 🔇');
            break;

        case 'unmuteall':
        case 'vunmuteall':
            for (const member of voiceChannel.members.values()) {
                await member.voice.setMute(false);
            }
            message.reply('Unmuted all users in your channel! 🔊');
            break;

        default:
            console.log(`Unknown command received: ${command}`); // Debug log for unknown commands
            message.reply('Unknown command!');
            break;
    }

    if (message.content === '/wisdomhelp') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🎧 WISDOM Voice Manager - Help Guide')
            .setDescription('Create and manage your own voice channels with ease!')
            .setColor('#5865F2')
            .setImage('https://cdn.discordapp.com/attachments/1355027719221547219/1359720997791465543/Dark_Purple_Modern_Animated_Podcast_Youtube_Channel_Intro_Video.gif?ex=67f8825c&is=67f730dc&hm=78444e2590bfc41ae66d3531845d803cf75ec19d52c73ca35768b51bc5a8d7db&')
            .addFields(
                {
                    name: '📝 Basic Usage',
                    value: 'Join the "Create VC" channel to get your own voice channel',
                    inline: false
                },
                {
                    name: '🛠️ Admin Commands',
                    value: '`/setwisdomvoice` - Create a control panel in the current channel',
                    inline: false
                },
                {
                    name: '🎮 Control Panel',
                    value: 'Use the buttons in the control panel to:\n• 🔒 Lock/Unlock your room\n• ✏️ Rename your channel\n• ➕ Invite users\n• ❌ Kick users',
                    inline: false
                },
                {
                    name: '⌨️ Text Commands',
                    value: '`!lock` - Lock your voice channel\n`!unlock` - Unlock your voice channel\n`!rename [name]` - Rename your channel\n`!invite @user` - Allow a user to join\n`!kick @user` - Kick a user from your channel',
                    inline: false
                },
                {
                    name: '💡 Tips',
                    value: '• You can only control your own voice channel\n• Locked channels prevent new users from joining\n• Channel owner can always join their channel',
                    inline: false
                }
            )
            .setFooter({ text: 'WISDOM Voice Manager • Made with 💖' });

        await message.channel.send({ embeds: [helpEmbed] });
        return;
    }
};