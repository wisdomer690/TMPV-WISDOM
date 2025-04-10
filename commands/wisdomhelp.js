import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('wisdomhelp')
    .setDescription('Shows help information for WISDOM Voice Manager');

// Update prefix in the command execution
export async function execute(interaction) {
    try {
        const helpEmbed = new EmbedBuilder()
            .setTitle('✨ Your Personal Voice Channel ✨')
            .setDescription('Welcome to your voice channel control guide! Let\'s make it awesome!')
            .setColor('#FF6B6B')
            .addFields(
                {
                    name: '🎯 Quick Start',
                    value: '```Join "Create VC" → Get Your Room → Have Fun!```',
                    inline: false
                },
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
                },
                {
                    name: '💫 Pro Tips',
                    value: '```md\n# Your Channel, Your Rules!\n* Use commands with @ to target users\n* Set bitrate between 8-96\n* User limit of 0 means unlimited```',
                    inline: false
                }
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ 
                text: '🎧 Enjoy Your Voice Space!',
                iconURL: interaction.client.user.displayAvatarURL()
            });

        // Make the embed visible by removing ephemeral: true
        await interaction.reply({ 
            embeds: [helpEmbed]
        });
    } catch (error) {
        console.error('Help command error:', error);
        await interaction.reply({ 
            content: 'Sorry, there was an error displaying the help menu!'
        });
    }
}