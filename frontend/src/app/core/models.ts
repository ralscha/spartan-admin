export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string;
}
export interface Task {
  id: string;
  title: string;
  status: string;
  label: string;
  priority: string;
  createdAt: string;
}
export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: string;
  status: string;
}
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  type: string;
  calendar: string;
  duration: string;
  location: string;
  attendees: string[];
  allDay: boolean;
  reminder: boolean;
}
export interface Mail {
  id: string;
  name: string;
  email: string;
  subject: string;
  text: string;
  date: string;
  read: boolean;
  labels: string[];
  folder: string;
}
export interface Message {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
  mine: boolean;
}
export interface Conversation {
  id: string;
  name: string;
  status: string;
  unread: number;
  messages: Message[];
}
export interface Transaction {
  id: string;
  reference: string;
  customer: string;
  email: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  gateway: string;
  country: string;
  createdAt: string;
  fee: number;
  riskScore: number;
  description: string;
}
export interface Dashboard {
  revenue: number;
  subscriptions: number;
  activeUsers: number;
  conversion: number;
  series: number[];
  transactions: Transaction[];
}
export interface Settings {
  name: string;
  email: string;
  bio: string;
  language: string;
  theme: string;
  compact: boolean;
  marketingEmails: boolean;
  securityEmails: boolean;
  communicationEmails: boolean;
  mobileNotifications: boolean;
  desktopNotifications: boolean;
  defaultDashboard: string;
  sidebarBehavior: string;
  billingPlan: string;
  cardLastFour: string;
  cardExpiry: string;
}
export interface AiReply {
  reply: string;
}
