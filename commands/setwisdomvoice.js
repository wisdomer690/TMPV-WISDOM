import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('setwisdomvoice')
    .setDescription('Setup the voice generator system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    try {
        // Ensure interaction is deferred or replied
        await interaction.deferReply();

        // Your logic here
        const client = interaction.client;

        // Example of handling a command with the $v prefix
        if (interaction.commandName === 'setwisdomvoice') {
            // Your existing logic for setting up the voice system
            try {
                // Create category for voice channels
                const category = await interaction.guild.channels.create({
                    name: '🎧 TEMPORARY VOICE',
                    type: ChannelType.GuildCategory,
                });

                // Create the generator voice channel
                const generatorChannel = await interaction.guild.channels.create({
                    name: '➕│Create Room',
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: client.user.id,
                            allow: [
                                PermissionFlagsBits.ManageChannels,
                                PermissionFlagsBits.MoveMembers,
                                PermissionFlagsBits.Connect,
                                PermissionFlagsBits.Speak
                            ]
                        }
                    ]
                });

                // Create the control panel text channel
                const controlChannel = await interaction.guild.channels.create({
                    name: '🎮│voice-control',
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            allow: [PermissionFlagsBits.ViewChannel],
                            deny: [PermissionFlagsBits.SendMessages]
                        },
                        {
                            id: client.user.id,
                            allow: [
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ManageMessages,
                                PermissionFlagsBits.EmbedLinks
                            ]
                        }
                    ]
                });

                // Initialize server settings if not exists
                if (!client.serverSettings) {
                    client.serverSettings = new Map();
                }

                // Save the settings
                client.serverSettings.set(interaction.guild.id, {
                    createChannelID: generatorChannel.id,
                    controlTextChannelID: controlChannel.id,
                    categoryID: category.id
                });

                // Update the deferred reply instead of sending a new one
                await interaction.editReply({
                    content: `✅ Voice system has been set up successfully!\n` +
                            `Join the voice channel to create your own voice channel.\n` +
                            `Controls will appear in the control panel.`,
                    ephemeral: true
                });
            } catch (error) {
                console.error('Setup error details:', error);
                await interaction.editReply({
                    content: `❌ Setup error: ${error.message}\nPlease make sure I have Administrator permissions.`,
                    ephemeral: true
                });
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'An error occurred!', ephemeral: true });
        }
    }
}