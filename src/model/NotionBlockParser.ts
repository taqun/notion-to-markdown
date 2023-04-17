import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import {
  ImageBlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

import { ExtendBlockObjectResponse } from '../types/notion';

export const parseBlocks = async (
  blocks: ExtendBlockObjectResponse[],
  imageDir: string | null,
  depth = 0
) => {
  let results = depth == 0 ? '\n' : '';

  for (const [i, block] of blocks.entries()) {
    const isLast = i === blocks.length - 1;
    const indent2space = '  '.repeat(depth);
    const indent3space = '   '.repeat(depth);

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
        results += `${indent2space}- ${block.bulleted_list_item.rich_text[0].plain_text}\n`;

        if (
          block.children == null &&
          !isLast &&
          blocks[i + 1].type !== 'bulleted_list_item'
        ) {
          results += '\n';
        }
        break;
      case 'numbered_list_item':
        results += `${indent3space}1. ${block.numbered_list_item.rich_text[0].plain_text}\n`;

        if (
          block.children == null &&
          !isLast &&
          blocks[i + 1].type !== 'numbered_list_item'
        ) {
          results += '\n';
        }
        break;
      case 'quote':
        results += `> ${block.quote.rich_text[0].plain_text}\n\n`;
        break;
      case 'code':
        results += `\`\`\`
${block.code.rich_text[0].plain_text}
\`\`\`\n\n`;
        break;
      case 'image':
        results += await parseImage(block.image, block.id, imageDir);
        break;
      default:
        console.log(block.type);
        break;
    }

    if (block.children) {
      const childContents = await parseBlocks(
        block.children,
        imageDir,
        depth + 1
      );
      results += childContents;
    }
  }

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
    return `_${plain_text}_`;
  }

  if (annotations.underline) {
    return `<u>${plain_text}</u>`;
  }

  if (annotations.strikethrough) {
    return `~~${plain_text}~~`;
  }

  if (annotations.code) {
    return `\`${plain_text}\``;
  }

  return plain_text;
};

const parseImage = async (
  image: ImageBlockObjectResponse['image'],
  blockId: string,
  imageDir: string | null
) => {
  let results = '';
  let savedPath = '';

  const altText = image.caption[0] != null ? image.caption[0].plain_text : '';

  switch (image.type) {
    case 'file':
      savedPath = await parseImageFile(image.file.url, blockId, imageDir);
      results = `![${altText}](${savedPath})\n\n`;
      break;
    case 'external':
      results = `![${altText}](${image.external.url})\n\n`;
      break;
    default:
      break;
  }

  return results;
};

const parseImageFile = async (
  url: string,
  blockId: string,
  imageDir: string | null
) => {
  let imagePath = '';

  if (imageDir) {
    fs.mkdirSync(path.join(imageDir, 'images'), { recursive: true });

    const extname = path.extname(new URL(url).pathname);
    const fileName = blockId + extname;
    const filePath = path.join(imageDir, 'images', fileName);
    imagePath = path.join('/images', fileName);

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
  }

  return imagePath;
};
