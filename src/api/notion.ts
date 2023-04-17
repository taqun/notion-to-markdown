import { Client } from '@notionhq/client';
import {
  BlockObjectResponse,
  ListBlockChildrenResponse,
} from '@notionhq/client/build/src/api-endpoints';

import { ExtendBlockObjectResponse } from '../types/notion';
import { wait } from '../utils/utils';

class NotionClient {
  private client?: Client;

  constructor(token: string) {
    this.client = new Client({ auth: token });
  }

  async getArticle(databaseId: string, slug: string) {
    if (this.client == null) {
      throw new Error('Client is not initialized.');
    }

    const filter = {
      property: 'Slug',
      rich_text: {
        contains: slug,
      },
    };

    return await this.client.databases.query({
      database_id: databaseId,
      filter,
    });
  }

  async getArticles(databaseId: string) {
    if (this.client == null) {
      throw new Error('Client is not initialized.');
    }

    const filter = process.env.INCLUDE_DRAFT
      ? {
          or: [
            { property: 'Status', status: { equals: 'Draft' } },
            { property: 'Status', status: { equals: 'Published' } },
          ],
        }
      : {
          property: 'Status',
          status: { equals: 'Published' },
        };

    return await this.client.databases.query({
      database_id: databaseId,
      filter,
    });
  }

  async getBlocks(blockId: string) {
    if (this.client == null) {
      throw new Error('Client is not initialized.');
    }

    const blocks: ExtendBlockObjectResponse[] = [];
    let startCursor = null;

    do {
      const { results, next_cursor, has_more }: ListBlockChildrenResponse =
        await this.client.blocks.children.list({
          block_id: blockId,
          page_size: 100,
          start_cursor: startCursor || undefined,
        });

      for (const block of results) {
        if ('has_children' in block && block.has_children) {
          await wait(334);

          const children = await this.getBlocks(block.id);
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
  }
}

export default NotionClient;
