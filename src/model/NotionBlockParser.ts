import {
  BlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

export const parseBlocks = (blocks: BlockObjectResponse[]) => {
  let results = '\n';

  blocks.forEach((block) => {
    switch (block.type) {
      case 'heading_1':
        results += `# ${block.heading_1.rich_text[0].plain_text}\n\n`;
        break;
      case 'heading_2':
        results += `## ${block.heading_2.rich_text[0].plain_text}\n\n`;
        break;
      case 'heading_3':
        results += `### ${block.heading_3.rich_text[0].plain_text}\n\n`;
        break;
      case 'paragraph':
        results += `${parseRichTexts(block.paragraph.rich_text)}\n\n`;
        break;
      case 'bulleted_list_item':
        results += `- ${block.bulleted_list_item.rich_text[0].plain_text}\n`;
        break;
      default:
        break;
    }
  });

  return results;
};

const parseRichTexts = (richTexts: RichTextItemResponse[]) => {
  return richTexts.map((richText) => parseRichText(richText)).join('');
};

const parseRichText = (richText: RichTextItemResponse) => {
  const { plain_text, annotations, href } = richText;

  if (href) {
    return `[${plain_text}](${href})`;
  }

  if (annotations.bold) {
    return `**${plain_text}**`;
  }

  if (annotations.italic) {
    return `*${plain_text}*`;
  }

  if (annotations.underline) {
    return `__${plain_text}__`;
  }

  if (annotations.strikethrough) {
    return `~~${plain_text}~~`;
  }

  if (annotations.code) {
    return `\`${plain_text}\``;
  }

  return plain_text;
};
