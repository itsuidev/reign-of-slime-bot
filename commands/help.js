import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, AttachmentBuilder } from "discord.js";

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
    categories[categoryName].push(cmd);
  }

  // Prepare dropdown options for all pages in all categories
  const options = [];
  for (const [catName, cmds] of Object.entries(categories)) {
    const totalPages = Math.ceil(cmds.length / ITEMS_PER_PAGE);
    for (let p = 0; p < totalPages; p++) {
      const start = p * ITEMS_PER_PAGE;
      const end = Math.min(start + ITEMS_PER_PAGE, cmds.length);
      options.push({
        label: `${catName} - Page ${p + 1}`,
        value: `${catName}|${p}`, // encode category + page
        description: `Commands ${start + 1}-${end} of ${cmds.length}`,
      });
    }
  }

  // Attachment za separator sliku
  const separatorAttachment = new AttachmentBuilder('./assets/img/separator.png'); // lokalni fajl

  const generateEmbed = (catName, page) => {
    const cmds = categories[catName];
    const start = page * ITEMS_PER_PAGE;
    const pageCommands = cmds.slice(start, start + ITEMS_PER_PAGE);

    return new EmbedBuilder()
      .setTitle(`Help - ${catName} (${start + 1}-${Math.min(start + ITEMS_PER_PAGE, cmds.length)} of ${cmds.length})`)
      .setColor(0x26d3d9)
      .setDescription(pageCommands.map(cmd => `**/${cmd.data.name}** - ${cmd.data.description}`).join("\n"))
      .setFooter({ text: `Page ${page + 1} of ${Math.ceil(cmds.length / ITEMS_PER_PAGE)}` })
      .setImage('attachment://separator.png');
  };

  const rowSelect = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("helpDropdown")
      .setPlaceholder("Select category and page")
      .addOptions(options)
  );

  // Initial embed
  const firstOption = options[0].value.split("|");
  let [currentCategory, currentPage] = [firstOption[0], parseInt(firstOption[1])];

  // Send initial embed sa attachmentom
  await interaction.reply({
    embeds: [generateEmbed(currentCategory, currentPage)],
    components: [rowSelect],
    files: [separatorAttachment],
  });

  // Fetch the message za collector
  const message = await interaction.fetchReply();

  // Collector
  const collector = message.createMessageComponentCollector({ time: 5 * 60 * 1000 });

  collector.on("collect", async i => {
    if (i.user.id !== interaction.user.id) {
      // ephemeral flag: 64
      return i.reply({ content: "❌ You can't interact with this.", flags: 64 });
    }

    if (i.isStringSelectMenu()) {
      const [catName, page] = i.values[0].split("|");
      currentCategory = catName;
      currentPage = parseInt(page);

      // update embed sa istim attachmentom
      await i.update({
        embeds: [generateEmbed(currentCategory, currentPage)],
        files: [separatorAttachment],
      });
    }
  });

  collector.on("end", () => {
    // opcionalno: onemogući dropdown kad collector istekne
    rowSelect.components[0].setDisabled(true);
    message.edit({ components: [rowSelect] }).catch(() => {});
  });
}
