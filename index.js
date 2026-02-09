import { Client, Collection, GatewayIntentBits, REST, Routes } from "discord.js";
import fs from "fs";
import "dotenv/config";
import express from "express";

const app = express();

// Ruta za health check
app.get("/", (req, res) => {
  res.send("✅ Bot is running!");
});

// Render / Heroku port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Express server running on port ${PORT}`));

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

client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await deployCommands();
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


async function deployCommands() {
  const commands = [];
  const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log("✅ Commands deployed automatically");
  } catch (error) {
    console.error("❌ Failed to deploy commands:", error);
  }
}