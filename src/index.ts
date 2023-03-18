import fs from 'fs';
import path from 'path';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

import { getArticles, getBlocks } from './api/notion';
import { Article } from './model/Article';
import { wait } from './utils/utils';

const hasRequiredEnvVars = () => {
  return (
    process.env.NOTION_TOKEN != null &&
    process.env.NOTION_DATABASE_ID != null &&
    process.env.OUT_DIR != null
  );
};

const main = async () => {
  if (hasRequiredEnvVars() == false) {
    throw new Error('Required env variables is not set.');
  }

  const response = await getArticles();

  const articles: Article[] = [];

  for (const page of response.results) {
    const blocks = await getBlocks(page.id);

    const article = new Article();
    await article.parse({
      page: page as PageObjectResponse,
      blocks: blocks,
    });
    articles.push(article);

    await wait(334);
  }

  const outDir = process.env.OUT_DIR;

  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });

    articles.forEach((article) => {
      fs.writeFileSync(path.join(outDir, article.fileName), article.contents);
    });
  }
};

(async () => {
  await main();
})();
