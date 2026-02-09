import { Client, Collection, GatewayIntentBits } from "discord.js";
import fs from "fs";
import "dotenv/config";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Kolekcija komandi
client.commands = new Collection();

// Učitaj sve komande iz foldera
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Slash komande handler
client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "❌ There was an error executing this command.", ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
