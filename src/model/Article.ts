import {
  BlockObjectResponse,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';
import matter from 'gray-matter';
import { parseBlocks } from './NotionBlockParser';

export type ArticleData = {
  page: PageObjectResponse;
  blocks: BlockObjectResponse[];
};

export class Article {
  public fileName = '';
  public contents = '';

  private imageDir: string | null = null;

  async parse(data: ArticleData, imageDir: string) {
    this.imageDir = imageDir;

    const { date, title, slug } = this.parseProperties(data.page.properties);

    this.fileName = `${date}-${slug}.md`;

    const pageContents = await this.parseBlocks(data.blocks);
    this.contents = matter.stringify(pageContents, { title });
  }

  private parseProperties(properties: PageObjectResponse['properties']) {
    const props = properties;
    let date, title, slug;

    if (props.Date.type === 'date' && props.Date.date != null) {
      date = props.Date.date.start;
    }

    if (props.Title.type === 'title' && props.Title.title != null) {
      title = props.Title.title[0].plain_text;
    }

    if (props.Slug.type === 'rich_text' && props.Slug.rich_text != null) {
      slug = props.Slug.rich_text[0].plain_text;
    }

    return { date, title, slug };
  }

  private parseBlocks(blocks: BlockObjectResponse[]) {
    const result = parseBlocks(blocks, this.imageDir);
    return result;
  }
}
