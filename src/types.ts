export enum PostType {
  Twitter = 'twitter',
  Reddit = 'reddit',
}

export interface IPost {
  created: string;
  id: string;
  text: string;
  hidden?: boolean;
  url: string;
  lang?: string;
  likes: number;
  type: PostType;
  sentiment?: string;
  category?: string;
  translation?: string;
}
