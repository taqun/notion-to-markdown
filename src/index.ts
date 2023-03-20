import fs from 'fs';
import path from 'path';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import * as core from '@actions/core';

import { Article } from './model/Article';
import { wait } from './utils/utils';
import NotionClient from './api/notion';

const main = async () => {
  const notionToken = core.getInput('notionToken');
  const notionDatabaseId = core.getInput('notionDatabaseId');
  const outDir = core.getInput('outDir') || './articles/';
  const imageDir = core.getInput('imageDir') || './public/';

  if (notionToken == null || notionDatabaseId == null) {
    throw new Error('Required inputs is not set.');
  }

  const notionClient = new NotionClient(notionToken);

  const response = await notionClient.getArticles(notionDatabaseId);

  const articles: Article[] = [];

  for (const page of response.results) {
    const blocks = await notionClient.getBlocks(page.id);

    const article = new Article();
    await article.parse(
      {
        page: page as PageObjectResponse,
        blocks: blocks,
      },
      imageDir
    );
    articles.push(article);

    await wait(334);
  }

  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });

    articles.forEach((article) => {
      fs.writeFileSync(path.join(outDir, article.fileName), article.contents);
    });
  }
};

try {
  main();
} catch (error) {
  if (error instanceof Error) {
    core.setFailed(error.message);
  }
}
