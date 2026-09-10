export interface UserResponseDto {
  id: string;
  email: string;
  username: string;
  role?: string;
  createdAt?: Date;
}

export interface AuthResponseDto {
  token: string;
  user: UserResponseDto;
}

export interface CommentAuthorDto {
  id: string;
  username: string;
}

export interface CommentItemDto {
  id: string;
  content: string;
  authorName: string;
  createdAt: Date;
}

export interface PostFeedItemDto {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  created_at: Date;
  author: CommentAuthorDto | null;
  likeCount: number;
  commentCount: number;
  comments: CommentItemDto[];
  isLiked: boolean;
}

export interface PostDetailDto {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  created_at: Date;
  author: CommentAuthorDto | null;
  comments: CommentItemDto[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

export interface LikeResponseDto {
  success: boolean;
  likeCount: number;
  isLiked: boolean;
}
