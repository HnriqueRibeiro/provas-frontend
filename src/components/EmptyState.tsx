import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state">
    <div className="empty-state-icon"><Inbox size={25} /></div>
    <h3>{title}</h3>
    <p>{description}</p>
    {action && <div className="empty-state-action">{action}</div>}
  </div>;
}
