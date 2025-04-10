import { ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, '..', 'config.json'), 'utf-8'));

export default async (client, oldState, newState) => {
    // Get server settings
    const serverSettings = client.serverSettings.get(newState.guild.id);
    if (!serverSettings) return;

    // Create room when user joins the generator channel
    if (newState.channelId === serverSettings.createChannelID) {
        const guild = newState.guild;
        const member = newState.member;

        try {
            // Create new voice channel
            const channel = await guild.channels.create({
                name: `🎧│${member.displayName}'s Room`,
                type: ChannelType.GuildVoice,
                parent: newState.channel.parent,
                userLimit: 99,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: member.id,
                        allow: [
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.MuteMembers,
                            PermissionsBitField.Flags.DeafenMembers,
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak,
                            PermissionsBitField.Flags.Stream,
                            PermissionsBitField.Flags.UseVAD
                        ],
                    },
                    {
                        id: client.user.id,
                        allow: [
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.MoveMembers,
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak
                        ],
                    }
                ],
            });

            // Store channel info
            client.tempChannels.set(channel.id, {
                owner: member.id,
                locked: false,
                controlMessage: null
            });

            // Move user to the new channel
            await member.voice.setChannel(channel).catch(async (error) => {
                console.error('Failed to move user (first attempt):', error);
                // Second attempt with a slight delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                await member.voice.setChannel(channel.id).catch(e => {
                    console.error('Failed to move user (second attempt):', e);
                });
            });

            // Send control panel
            await sendControlPanel(client, guild, channel, member);

            // Send help embed in the temporary channel
            const helpEmbed = new EmbedBuilder()
                .setTitle('TMPV-WISDOM Help')
                .setDescription('Here are the commands you can use in your temporary voice channel:')
                .setColor('#FF6B6B')
                .addFields(
                    {
                        name: '🎮 Basic Controls',
                        value: '```yaml\n🔒 $vlock    - Make room private\n🔓 $vunlock  - Make room public\n✏️ $vrename  - Change room name```',
                        inline: false
                    },
                    {
                        name: '👥 User Management',
                        value: '```yaml\n➕ $vinvite    - Add friend\n❌ $vkick      - Remove user\n🔇 $vmute     - Mute user\n🔊 $vunmute   - Unmute user\n⛔ $vban      - Ban user\n✅ $vunban    - Unban user```',
                        inline: false
                    },
                    {
                        name: '⚙️ Channel Settings',
                        value: '```yaml\n👥 $vlimit    - Set user limit\n🎵 $vbitrate  - Set audio quality\n🔇 $vmuteall  - Mute everyone\n🔊 $vunmuteall- Unmute everyone```',
                        inline: false
                    }
                )
                .setFooter({
                    text: 'TMPV-WISDOM v1.0 • Developed by Apollo Belevedere'
                });

            try {
                await channel.send({ embeds: [helpEmbed] });
            } catch (error) {
                console.error('Failed to send help embed:', error);
            }

        } catch (error) {
            console.error('Error in voice channel creation:', error);
        }
    }

    // Delete empty channels
    try {
        if (oldState.channel && 
            client.tempChannels.has(oldState.channelId) && 
            oldState.channel.members.size === 0) {
            // Check if channel still exists before trying to delete
            const channel = await oldState.guild.channels.fetch(oldState.channelId);
            const channelData = client.tempChannels.get(oldState.channelId);
            
            // Delete control panel message if it exists
            if (channelData && channelData.controlMessage) {
                const serverSettings = client.serverSettings.get(oldState.guild.id);
                const controlChannel = oldState.guild.channels.cache.get(serverSettings.controlTextChannelID);
                try {
                    const controlMessage = await controlChannel.messages.fetch(channelData.controlMessage);
                    if (controlMessage) await controlMessage.delete();
                } catch (error) {
                    console.error('Error deleting control message:', error);
                }
            }

            // Delete the voice channel
            if (channel) {
                await channel.delete();
                client.tempChannels.delete(oldState.channelId);
            }
        }
    } catch (error) {
        if (error.code !== 10003) { // Ignore "Unknown Channel" errors
            console.error('Error deleting channel:', error);
        }
        // Clean up the tempChannels collection anyway
        client.tempChannels.delete(oldState.channelId);
    }
};

async function sendControlPanel(client, guild, channel, owner) {
    try {
        const serverSettings = client.serverSettings.get(guild.id);
        if (!serverSettings || !serverSettings.controlTextChannelID) {
            console.error('Server settings not found or control channel not set');
            return;
        }

        const controlChannel = await guild.channels.fetch(serverSettings.controlTextChannelID);
        if (!controlChannel) {
            console.error('Control channel not found');
            return;
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`help_${channel.id}`)
                    .setLabel('Help')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('❓'),
                new ButtonBuilder()
                    .setCustomId(`lock_${channel.id}`)
                    .setLabel('Lock Room')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔒'),
                new ButtonBuilder()
                    .setCustomId(`unlock_${channel.id}`)
                    .setLabel('Unlock Room')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔓'),
                new ButtonBuilder()
                    .setCustomId(`rename_${channel.id}`)
                    .setLabel('Rename Room')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('✏️'),
                new ButtonBuilder()
                    .setCustomId(`invite_${channel.id}`)
                    .setLabel('Invite User')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('➕'),
                new ButtonBuilder()
                    .setCustomId(`kick_${channel.id}`)
                    .setLabel('Kick User')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

        const embed = new EmbedBuilder()
            .setTitle('Voice Channel Controls')
            .setDescription(`Control panel for ${channel.name}`)
            .setColor(config.color)
            .addFields(
                { name: 'Owner', value: owner.displayName, inline: true },
                { name: 'Status', value: 'Unlocked 🔓', inline: true }
            );

        const message = await controlChannel.send({ 
            content: `${owner}`,
            embeds: [embed], 
            components: [row] 
        });

        // Store the message ID
        client.tempChannels.set(channel.id, {
            owner: owner.id,
            locked: false,
            controlMessage: message.id
        });
    } catch (error) {
        console.error('Error sending control panel:', error);
    }
}