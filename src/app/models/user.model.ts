export interface User {
  id: string;
  name: string;
  image: string;
  domain: string;
  bio: string;
  email: string;
  password: string;
  userType: string;
  articleCount?: number;
  totalViews?: number;
}