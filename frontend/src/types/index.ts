export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role?: string;
  bio?: string;
  createdAt?: string;
}

export interface UserPost {
  id: string;
  content: string;
  imageUrl?: string | null;
  authorId: string;
  createdAt?: string;
  created_at?: string;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  author?: {
    id: string;
    username: string;
  };
}

export interface SearchProfileItem {
  id: string;
  username: string;
  email?: string;
  role?: string;
  postCount?: number;
}

export interface Author {
  id: string;
  username: string;
}

export interface CommentItem {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  created_at: string;
  author: Author | null;
  likeCount: number;
  commentCount: number;
  comments?: CommentItem[];
  isLiked?: boolean;
}
