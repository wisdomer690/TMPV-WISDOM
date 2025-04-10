import { Collection } from 'discord.js';

export default async (client) => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Initialize server settings collection if it doesn't exist
    if (!client.serverSettings) {
        client.serverSettings = new Collection();
    }

    // Set the bot's status to "🔊 Wisdom TMPV"
    try {
        client.user.setActivity('🔊 Wisdom TMPV', { type: 'PLAYING' });
        console.log('Activity set to: PLAYING 🔊 Wisdom TMPV');
    } catch (error) {
        console.error('Error setting activity:', error);
    }
};