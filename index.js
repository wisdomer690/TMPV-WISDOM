import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { readFileSync, readdirSync } from 'fs';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize the client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Channel]
});

// Initialize collections
client.commands = new Collection();
client.prefixCommands = new Collection(); // New collection for prefix commands
client.serverSettings = new Collection();
client.tempChannels = new Collection();

// Load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const fileUrl = pathToFileURL(filePath);
    const command = await import(fileUrl);
    
    // Handle both slash commands and prefix commands
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
    if (file.startsWith('v') && 'execute' in command) { // For prefix commands (vban.js, vmute.js etc)
        client.prefixCommands.set(file.replace('.js', ''), command);
    }
}

// Handle slash commands
// Update the interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: 'There was an error executing this command!', 
            ephemeral: true 
        }).catch(console.error);
    }
});

// Import event handlers
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

// Load event handlers
for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const fileUrl = pathToFileURL(filePath); // Convert to file URL
    const event = await import(fileUrl);
    const eventName = file.split('.')[0];
    
    if (event.default) {
        client.on(eventName, (...args) => event.default(client, ...args));
    }
}

// Remove the old event handler imports and registrations

// Enhanced messageCreate handler for prefix commands
const prefix = '$v';

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // Extract the command name without the prefix
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    console.log(`Prefix command received: ${commandName}`); // Debug log

    // Look for the command in the prefixCommands collection
    const command = client.prefixCommands.get(commandName);
    if (!command) {
        console.log(`Command not found: ${commandName}`);
        return;
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        message.channel.send('There was an error executing this command!');
    }
});
client.login(process.env.TOKEN);