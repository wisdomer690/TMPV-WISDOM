import { PermissionsBitField } from 'discord.js';

export default async (client, interaction) => {
    if (!interaction.isButton()) return;

    const [action, channelId] = interaction.customId.split('_');
    const channel = interaction.guild.channels.cache.get(channelId);
    const channelData = client.tempChannels.get(channelId);

    if (!channel || !channelData) {
        await interaction.reply({ content: '❌ This voice channel no longer exists.', ephemeral: true });
        return;
    }

    if (channelData.owner !== interaction.user.id) {
        await interaction.reply({ content: '❌ Only the room owner can use these controls.', ephemeral: true });
        return;
    }

    try {
        switch (action) {
            case 'lock':
                await channel.permissionOverwrites.edit(interaction.guild.id, {
                    Connect: false
                });
                channelData.locked = true;
                await interaction.reply({ content: '🔒 Room locked!', ephemeral: true });
                break;

            case 'unlock':
                await channel.permissionOverwrites.edit(interaction.guild.id, {
                    Connect: true
                });
                channelData.locked = false;
                await interaction.reply({ content: '🔓 Room unlocked!', ephemeral: true });
                break;

            case 'rename':
                await interaction.reply({ 
                    content: 'Please send the new name for your room (max 32 characters)',
                    ephemeral: true 
                });
                break;

            case 'invite':
                await interaction.reply({ 
                    content: 'Please mention the user you want to invite',
                    ephemeral: true 
                });
                break;

            case 'kick':
                await interaction.reply({ 
                    content: 'Please mention the user you want to kick',
                    ephemeral: true 
                });
                break;
        }

        // Update the stored channel data
        client.tempChannels.set(channelId, channelData);

    } catch (error) {
        console.error('Button interaction error:', error);
        await interaction.reply({ 
            content: '❌ Failed to perform that action. Please try again.',
            ephemeral: true 
        }).catch(() => {});
    }
};