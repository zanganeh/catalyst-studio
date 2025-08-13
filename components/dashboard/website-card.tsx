import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Website } from '@/types/api';

interface WebsiteCardProps {
  website: Website;
}

export function WebsiteCard({ website }: WebsiteCardProps) {
  const lastModifiedText = `Last modified ${formatDistanceToNow(new Date(website.updatedAt))} ago`;
  
  return (
    <Link 
      href={`/studio/${website.id}`}
      aria-label={`Open ${website.name} website${website.category ? ` (${website.category})` : ''}`}
    >
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full group">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {website.icon ? (
                <div 
                  className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="text-2xl" role="img" aria-label={`${website.name} icon`}>
                    {website.icon}
                  </span>
                </div>
              ) : (
                <div 
                  className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10"
                  aria-hidden="true" 
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                  {website.name}
                </h3>
                {website.category && (
                  <span className="text-xs text-muted-foreground">
                    {website.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <time dateTime={website.updatedAt.toString()}>
              {lastModifiedText}
            </time>
          </p>
          {website.description && (
            <p className="text-sm mt-2 line-clamp-2" title={website.description}>
              {website.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}