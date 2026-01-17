export interface Report {
  name: string;
  report: string;
  timeAgo: string;
  avatar: string;
  image: string | null;
}

export interface Thread {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  timeAgo: string;
  userName: string;
  userAvatar: string | null;
}

export interface Issue {
  id: string;
  image: string;
  title: string;
  location: string;
  category: string;
  categoryColor: string;
  priority: number;
  status: string;
  statusColor: string;
  submitted: string;
  description: string;
  likes?: number;
  commentCount?: number;
  reportsCount: number;
  engagement: string;
  timeAgo: string;
  recentReports: Report[];
  threads?: Thread[];
}

export interface HeatmapIssue {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  ward: number;
  tag_id: string;
  created_at: string;
  likes_count?: number;
  threads_count?: number;
  priority: number;
}

export interface WardData {
  wardNumber: number;
  issueCount: number;
  coordinates: [number, number][];
}
