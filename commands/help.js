import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Shows all commands with categories and pagination");

export const category = "Information";

const ITEMS_PER_PAGE = 10;

export async function execute(interaction) {
  const commands = interaction.client.commands;

  // Group commands by category
  const categories = {};
  for (const [name, cmd] of commands) {
    const categoryName = cmd.category || "Uncategorized";
    if (!categories[categoryName]) categories[categoryName] = [];
    categories[categoryName].push(cmd); // store full command object
  }

  const categoryNames = Object.keys(categories);
  let currentCategory = categoryNames[0];
  let currentPage = 0;

  // Function to generate embed
  const generateEmbed = () => {
    const cmds = categories[currentCategory];
    const start = currentPage * ITEMS_PER_PAGE;
    const pageCommands = cmds.slice(start, start + ITEMS_PER_PAGE);

    const embed = new EmbedBuilder()
      .setTitle(`Help - ${currentCategory} (${start + 1}-${Math.min(start + ITEMS_PER_PAGE, cmds.length)} of ${cmds.length})`)
      .setColor(0x00ff00)
      .setDescription(
        pageCommands.map(cmd => `**/${cmd.data.name}** - ${cmd.data.description}`).join("\n")
      )
      .setFooter({ text: `Page ${currentPage + 1} of ${Math.ceil(cmds.length / ITEMS_PER_PAGE)}` });

    return embed;
  };

  // Dropdown row
  const rowSelect = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("helpCategory")
      .setPlaceholder("Select category")
      .addOptions(categoryNames.map(name => ({ label: name, value: name })))
  );

  // Buttons row (with invisible spacers to align width)
  const rowButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("prevPage")
      .setLabel("⬅️ Prev")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("spacer1")
      .setLabel(" ")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("spacer2")
      .setLabel(" ")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("nextPage")
      .setLabel("Next ➡️")
      .setStyle(ButtonStyle.Primary)
  );

  // Send initial embed
  const message = await interaction.reply({
    embeds: [generateEmbed()],
    components: [rowSelect, rowButtons],
    fetchReply: true,
  });

  // Collector for dropdown + buttons
  const collector = message.createMessageComponentCollector({ time: 5 * 60 * 1000 });

  collector.on("collect", i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: "❌ You can't interact with this.", ephemeral: true });
    }

    if (i.isStringSelectMenu()) {
      currentCategory = i.values[0];
      currentPage = 0;
      i.update({ embeds: [generateEmbed()] });
    }

    if (i.isButton()) {
      const cmds = categories[currentCategory];
      const maxPage = Math.ceil(cmds.length / ITEMS_PER_PAGE) - 1;

      if (i.customId === "prevPage" && currentPage > 0) currentPage--;
      if (i.customId === "nextPage" && currentPage < maxPage) currentPage++;

      i.update({ embeds: [generateEmbed()] });
    }
  });
}
