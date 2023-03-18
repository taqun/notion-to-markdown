import { Client } from '@notionhq/client';
import {
  BlockObjectResponse,
  ListBlockChildrenResponse,
} from '@notionhq/client/build/src/api-endpoints';

import { ExtendBlockObjectResponse } from '../types/notion';
import { wait } from '../utils/utils';

const client = new Client({ auth: process.env.NOTION_TOKEN });

export const getArticles = async () => {
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (databaseId == null) {
    throw new Error('NOTION_DATABASE_ID is not set.');
  }

  return await client.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Status',
      status: { equals: 'Published' },
    },
  });
};

export const getBlocks = async (blockId: string) => {
  const blocks: ExtendBlockObjectResponse[] = [];
  let startCursor = null;

  do {
    const { results, next_cursor, has_more }: ListBlockChildrenResponse =
      await client.blocks.children.list({
        block_id: blockId,
        page_size: 100,
        start_cursor: startCursor || undefined,
      });

    for (const block of results) {
      if ('has_children' in block && block.has_children) {
        await wait(334);

        const children = await getBlocks(block.id);
        blocks.push({ ...block, children });
      } else {
        blocks.push(block as BlockObjectResponse);
      }
    }

    startCursor = has_more ? next_cursor : null;
    if (startCursor != null) {
      await wait(334);
    }
  } while (startCursor != null);

  return blocks;
};
