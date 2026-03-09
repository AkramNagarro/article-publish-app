export type CommentUserType = 'reader' | 'author';

export interface CommentItem {
  id?: string;
  articleId: string;
  parentId: string | null;
  userName: string;
  userImage: string;
  userType: CommentUserType;
  message: string;
  createdAt: string;
  likes: number;
}

export interface CommentNode extends CommentItem {
  replies: CommentNode[];
  showReplyBox?: boolean;
  replyText?: string;
}