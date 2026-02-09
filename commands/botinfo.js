import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("botinfo")
  .setDescription("Shows bot info.");

export const category = "Information";

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("Great Slime of Wisdom")
    .setDescription("Official Reign of Slime helper bot.")
    .setColor(0x00ff00)
    .addFields(
      { name: "Author", value: "Itsui" },
      { name: "Version", value: "0.0.1" }
    )
    .setFooter({ text: "Great Slime of Wisdom" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
