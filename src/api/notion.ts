import { Client } from '@notionhq/client';

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
  return await client.blocks.children.list({
    block_id: blockId,
  });
};
