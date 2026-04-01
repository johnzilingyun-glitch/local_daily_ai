import React from 'react';
import { 
  User, Shield, BarChart3, PieChart, MessageSquare, Search, Zap, UserCheck, Award 
} from 'lucide-react';
import { AgentRole } from '../../types';

export const roleIcons: Record<AgentRole, React.ReactNode> = {
  "Technical Analyst": <BarChart3 size={20} strokeWidth={1.5} />,
  "Fundamental Analyst": <PieChart size={20} strokeWidth={1.5} />,
  "Sentiment Analyst": <MessageSquare size={20} strokeWidth={1.5} />,
  "Risk Manager": <Shield size={20} strokeWidth={1.5} />,
  "Contrarian Strategist": <Zap size={20} strokeWidth={1.5} />,
  "Deep Research Specialist": <Search size={20} strokeWidth={1.5} />,
  "Professional Reviewer": <UserCheck size={20} strokeWidth={1.5} />,
  "Chief Strategist": <Award size={20} strokeWidth={1.5} />,
  "Moderator": <User size={20} strokeWidth={1.5} />,
};

export const roleColors: Record<AgentRole, string> = {
  "Technical Analyst": "text-blue-600 bg-blue-50 border-blue-100/50",
  "Fundamental Analyst": "text-emerald-600 bg-emerald-50 border-emerald-100/50",
  "Sentiment Analyst": "text-purple-600 bg-purple-50 border-purple-100/50",
  "Risk Manager": "text-rose-600 bg-rose-50 border-rose-100/50",
  "Contrarian Strategist": "text-amber-600 bg-amber-50 border-amber-100/50",
  "Deep Research Specialist": "text-cyan-600 bg-cyan-50 border-cyan-100/50",
  "Professional Reviewer": "text-indigo-600 bg-indigo-50 border-indigo-100/50",
  "Chief Strategist": "text-violet-600 bg-violet-50 border-violet-100/50",
  "Moderator": "text-zinc-600 bg-zinc-50 border-zinc-100/50",
};

export const roleNames: Record<AgentRole, string> = {
  "Technical Analyst": "技术分析师",
  "Fundamental Analyst": "基本面分析师",
  "Sentiment Analyst": "情绪分析师",
  "Risk Manager": "风险合规官",
  "Contrarian Strategist": "反向策略师",
  "Deep Research Specialist": "深度研究专家",
  "Professional Reviewer": "高级评审专家",
  "Chief Strategist": "首席策略师",
  "Moderator": "会议主持人",
};
