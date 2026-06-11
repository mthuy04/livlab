import { Lead } from '@/lib/types';
import { Users, Sparkles, Phone, FileText, Trophy, TrendingUp } from 'lucide-react';

interface DashboardStatsProps { leads: Lead[]; }

export default function DashboardStats({ leads }: DashboardStatsProps) {
  const total     = leads.length;
  const newLeads  = leads.filter((l) => l.status === 'Mới').length;
  const contacted = leads.filter((l) => l.status === 'Đã liên hệ').length;
  const quoted    = leads.filter((l) => l.status === 'Đã báo giá').length;
  const won       = leads.filter((l) => l.status === 'Đã chốt').length;

  const pipelineValue = leads
    .filter((l) => l.status !== 'Mất lead')
    .reduce((sum, l) => {
      const v = l.estimatedValueMin ? l.estimatedValueMin / 1000000 : 0;
      return sum + v;
    }, 0);

  const stats = [
    { label: 'Tổng lead',          value: total,                     icon: Users,      bg: 'bg-[#0B1623]', text: 'text-white',      sub: 'text-white/60' },
    { label: 'Lead mới',           value: newLeads,                  icon: Sparkles,   bg: 'bg-[#FEF3EC]', text: 'text-[#C8A96A]',     sub: 'text-[#627386]' },
    { label: 'Đã liên hệ',         value: contacted,                 icon: Phone,      bg: 'bg-[#F3F7FA]', text: 'text-[#0B1623]',  sub: 'text-[#627386]' },
    { label: 'Đã báo giá',         value: quoted,                    icon: FileText,   bg: 'bg-[#F3F7FA]', text: 'text-[#0B1623]',  sub: 'text-[#627386]' },
    { label: 'Đã chốt',            value: won,                       icon: Trophy,     bg: 'bg-[#EEF4F7]', text: 'text-[#123C5A]',  sub: 'text-[#627386]' },
    { label: 'Giá trị pipeline',   value: `${pipelineValue.toFixed(0)}M`, icon: TrendingUp, bg: 'bg-[#EEF4F7]', text: 'text-[#123C5A]', sub: 'text-[#627386]', prefix: '~' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 hover:shadow-sm transition-all duration-200`}>
          <stat.icon className={`w-5 h-5 mb-3 ${stat.text}`} />
          <p className={`text-2xl font-bold ${stat.text} mb-0.5`}>
            {stat.prefix}{stat.value}
          </p>
          <p className={`text-xs font-medium ${stat.sub}`}>{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
