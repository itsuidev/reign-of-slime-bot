import { REST, Routes } from "discord.js";
import fs from "fs";
import "dotenv/config";

const commands = [];
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

const clientId = "1470213681357787403";
const guildId = "1465268153486540853";

await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

console.log("✅ Successfully registered application commands.");
