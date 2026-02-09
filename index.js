import { Client, Collection, GatewayIntentBits, REST, Routes } from "discord.js";
import fs from "fs";
import "dotenv/config";
import express from "express";

/////////////////////
// Express server
const app = express();
app.get("/", (req, res) => res.send("✅ Bot is running!"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Express server running on port ${PORT}`));

/////////////////////
// Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load all commands
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  try {
    const module = await import(`./commands/${file}`);
    const cmd = module.data ? module : module.default;
    if (!cmd?.data || !cmd?.execute) {
      console.warn(`❌ Command ${file} missing data or execute, skipping`);
      continue;
    }
    client.commands.set(cmd.data.name, cmd);
  } catch (err) {
    console.error(`❌ Failed to load command ${file}:`, err);
  }
}

/////////////////////
// Deploy commands
async function deployCommands() {
  const commandsArray = [];
  for (const [, cmd] of client.commands) {
    if (!cmd?.data) continue;
    commandsArray.push(cmd.data.toJSON());
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;

  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandsArray });
    console.log("✅ Commands deployed automatically");
  } catch (error) {
    console.error("❌ Failed to deploy commands:", error);
  }
}

/////////////////////
// Event handlers
client.once("clientReady", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await deployCommands();
});

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

/////////////////////
// Login
client.login(process.env.DISCORD_TOKEN);
