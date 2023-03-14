import fs from 'fs';
import path from 'path';
import {
  BlockObjectResponse,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

import { getArticles, getBlocks } from './api/notion';
import { Article } from './model/Article';
import { wait } from './utils/utils';

const hasRequiredEnvVars = () => {
  return (
    process.env.NOTION_TOKEN != null &&
    process.env.NOTION_DATABASE_ID != null &&
    process.env.ARTICLES_DIR != null
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
    articles.push(
      new Article({
        page: page as PageObjectResponse,
        blocks: blocks.results as BlockObjectResponse[],
      })
    );

    await wait(334);
  }

  const articlesDir = process.env.ARTICLES_DIR;

  if (articlesDir) {
    fs.mkdirSync(articlesDir, { recursive: true });

    articles.forEach((article) => {
      fs.writeFileSync(
        path.join(articlesDir, article.fileName),
        article.contents
      );
    });
  }
};

(async () => {
  await main();
})();
