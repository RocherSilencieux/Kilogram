export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role?: string;
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
