import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export type ExtendBlockObjectResponse = BlockObjectResponse & {
  children?: BlockObjectResponse[];
};
