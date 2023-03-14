import { Client } from '@notionhq/client';
import {
  ListBlockChildrenResponse,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { wait } from './utils/utils';

const hasEnvVars = () => {
  return (
    process.env.NOTION_TOKEN != null && process.env.NOTION_DATABASE_ID != null
  );
};

const main = async () => {
  if (hasEnvVars() == false) {
    throw new Error('Required env variables is not set.');
  }

  const client = new Client({ auth: process.env.NOTION_TOKEN });

  const response = await client.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      property: 'Status',
      status: { equals: 'Published' },
    },
  });

  const results: {
    page: PageObjectResponse;
    blocks: ListBlockChildrenResponse;
  }[] = [];

  for (const page of response.results) {
    const blocks = await client.blocks.children.list({
      block_id: page.id,
    });
    results.push({ page: page as PageObjectResponse, blocks });

    await wait(334);
  }

  console.log(results);
};

(async () => {
  await main();
})();
