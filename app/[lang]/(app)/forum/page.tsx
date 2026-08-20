'use client';

import * as React from 'react';
import {
  Briefcase,
  Heart,
  MessagesSquare,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import { hasMinimumRole } from '@/lib/rbac';
import { applicationsApi } from '@/lib/services/applications';
import { commentairesApi, postsApi } from '@/lib/services/posts';
import type { PostResponse, TypePost } from '@/lib/types/posts';
import { FileDrop } from '@/components/file-drop';
import { formatDateTime, fullName } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const typeStyles: Record<TypePost, string> = {
  PUBLICITE: 'bg-chart-4/15 text-chart-4 ring-chart-4/20',
  POSTE_TRAVAIL: 'bg-chart-2/15 text-chart-2 ring-chart-2/20',
  FORMATION: 'bg-chart-3/15 text-chart-3 ring-chart-3/20',
};

export default function ForumPage() {
  const { dict } = useI18n();
  const t = dict.forum;
  const { user } = useSession();
  const {
    data: posts,
    loading,
    error,
    refetch,
  } = useApi('posts.list', () => postsApi.list());

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker={t.comments}
        title={t.title}
        description={t.description}
        icon={<MessagesSquare className="size-6" />}
        actions={user ? <NewPostDialog onCreated={refetch} /> : undefined}
      />

      {error ? (
        <ErrorState onRetry={refetch} description={error.message} />
      ) : loading ? (
        <div className="mx-auto grid max-w-2xl gap-4">
          {Array.from({ length: 3 }, (_, i) => {
            return <Skeleton key={i} className="h-48 w-full" />;
          })}
        </div>
      ) : (posts ?? []).length === 0 ? (
        <EmptyState
          icon={<MessagesSquare className="size-6" />}
          title={t.emptyTitle}
          description={t.emptyDesc}
          action={user ? <NewPostDialog onCreated={refetch} /> : undefined}
        />
      ) : (
        <div className="mx-auto grid max-w-2xl gap-4">
          {(posts ?? []).map((post) => (
            <PostCard key={post.id} post={post} onChanged={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  onChanged,
}: {
  post: PostResponse;
  onChanged: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.forum;
  const { user } = useSession();
  const canModerate = hasMinimumRole(user?.role, 'HR');
  const canDelete = canModerate || post.auteurId === user?.id;
  const [showComments, setShowComments] = React.useState(false);

  const authorName = fullName(post.auteurName, post.auteurLastname);

  const likeMutation = useApiMutation<number, PostResponse>(
    (postId) => postsApi.like(postId, user?.id ?? 0),
    {
      invalidate: ['posts.list'],
      onError: (err) => toast.error(err.message),
    }
  );

  const deleteMutation = useApiMutation<number, string>(
    (id) => postsApi.remove(id),
    {
      invalidate: ['posts.list'],
      onSuccess: () => {
        toast.success(t.successDeleted);
        onChanged();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <CardHeader className="gap-3 p-4 pb-0">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {authorName.replace('—', '').trim().charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{authorName}</p>
            <p className="text-muted-foreground text-xs">
              {formatDateTime(post.dateCreation)}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn('font-medium ring-1', typeStyles[post.typePost])}
          >
            {t.types[post.typePost]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {post.contenu}
        </p>
      </CardContent>
      <CardFooter className="bg-muted/20 gap-1 border-t px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary"
          onClick={() => user && likeMutation.mutate(post.id)}
          disabled={!user || likeMutation.isPending}
        >
          <Heart className="size-4" /> {post.nombreLikes} {t.likes}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setShowComments((v) => !v)}
        >
          <MessagesSquare className="size-4" /> {t.comments}
        </Button>
        {canDelete && (
          <DeletePostDialog
            onConfirm={() => deleteMutation.mutate(post.id)}
            pending={deleteMutation.isPending}
          />
        )}
        {user && post.typePost === 'POSTE_TRAVAIL' && (
          <ApplyDialog post={post} className="ms-auto" />
        )}
      </CardFooter>

      {showComments && (
        <div className="bg-background/50 border-t px-4 py-3">
          <CommentsList postId={post.id} />
        </div>
      )}
    </Card>
  );
}

function ApplyDialog({
  post,
  className,
}: {
  post: PostResponse;
  className?: string;
}) {
  const { dict } = useI18n();
  const t = dict.forum;
  const { user } = useSession();
  const [open, setOpen] = React.useState(false);
  const [cv, setCv] = React.useState<File | undefined>(undefined);
  const [motivation, setMotivation] = React.useState('');
  const [error, setError] = React.useState<string | undefined>(undefined);

  const applyMutation = useApiMutation<
    {
      cv: File;
      motivationLetter: string;
      poste: string;
      userId: number;
      postId: number;
    },
    unknown
  >((data) => applicationsApi.apply(data), {
    onSuccess: () => {
      toast.success(t.successApplied);
      setOpen(false);
      setCv(undefined);
      setMotivation('');
    },
    onError: (err) => {
      if (err.message.includes('déjà')) {
        setError(t.alreadyApplied);
      } else {
        toast.error(err.message);
      }
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setError(undefined);
          setCv(undefined);
          setMotivation('');
        }
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" className={className}>
            <Briefcase className="size-4" /> {t.apply}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.applyDialogTitle}</DialogTitle>
          <DialogDescription>{t.applyDialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.cvLabel}</label>
            <FileDrop
              accept={{ 'application/pdf': ['.pdf'] }}
              maxSize={10 * 1024 * 1024}
              onFileSelect={setCv}
              onClear={() => setCv(undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.motivationLabel}</label>
            <Textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder={t.motivationPlaceholder}
              rows={4}
            />
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <DialogFooter className="pt-2">
            <Button
              onClick={() =>
                user &&
                cv &&
                applyMutation.mutate({
                  cv,
                  motivationLetter: motivation,
                  poste: post.contenu,
                  userId: user.id,
                  postId: post.id,
                })
              }
              disabled={!cv || !user || applyMutation.isPending}
            >
              {applyMutation.isPending ? t.submittingApply : t.apply}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeletePostDialog({
  onConfirm,
  pending,
}: {
  onConfirm: () => void;
  pending: boolean;
}) {
  const { dict } = useI18n();
  const t = dict.forum;
  const [open, setOpen] = React.useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-4" /> {t.delete}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deletePostTitle}</AlertDialogTitle>
          <AlertDialogDescription>{t.deletePostDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            disabled={pending}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {t.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function NewPostDialog({ onCreated }: { onCreated: () => void }) {
  const { dict } = useI18n();
  const t = dict.forum;
  const { user } = useSession();
  const [open, setOpen] = React.useState(false);
  const [typePost, setTypePost] = React.useState<TypePost>('PUBLICITE');
  const [contenu, setContenu] = React.useState('');

  const createMutation = useApiMutation<
    { contenu: string; typePost: TypePost; auteurId: number },
    PostResponse
  >((body) => postsApi.create(body), {
    invalidate: ['posts.list'],
    onSuccess: () => {
      toast.success(t.successCreated);
      setOpen(false);
      setContenu('');
      setTypePost('PUBLICITE');
      onCreated();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus /> {t.newPost}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.createDialogTitle}</DialogTitle>
          <DialogDescription>{t.createDialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t.typeLabel}</label>
              <Select
                value={typePost}
                onValueChange={(v) => setTypePost(v as TypePost)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(t.types) as TypePost[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {t.types[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.contentLabel}</label>
            <Textarea
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder={t.contentPlaceholder}
              rows={5}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              onClick={() =>
                user &&
                createMutation.mutate({
                  contenu,
                  typePost,
                  auteurId: user.id,
                })
              }
              disabled={!contenu.trim() || !user || createMutation.isPending}
            >
              {createMutation.isPending ? t.submitting : t.submit}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommentsList({ postId }: { postId: number }) {
  const { dict } = useI18n();
  const t = dict.forum;
  const { user } = useSession();
  const canModerate = hasMinimumRole(user?.role, 'HR');
  const [text, setText] = React.useState('');

  const {
    data: comments,
    loading,
    error,
    refetch,
  } = useApi(['posts.comments', String(postId)], () =>
    commentairesApi.listByPost(postId)
  );

  const createMutation = useApiMutation<
    { postId: number; userId: number; contenu: string },
    unknown
  >(({ postId: p, userId: u, contenu: c }) => commentairesApi.create(p, u, c), {
    invalidate: [['posts.comments', String(postId)], 'posts.list'],
    onSuccess: () => {
      setText('');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useApiMutation<number, string>(
    (id) => commentairesApi.remove(id),
    {
      invalidate: [['posts.comments', String(postId)]],
      onSuccess: () => {
        toast.success(t.commentDeleted);
        refetch();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <div className="space-y-3">
      {user && (
        <div className="flex gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.commentPlaceholder}
            rows={2}
            className="min-h-9 flex-1 resize-none text-sm"
          />
          <Button
            size="sm"
            className="self-end"
            onClick={() =>
              createMutation.mutate({
                postId,
                userId: user.id,
                contenu: text,
              })
            }
            disabled={!text.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? t.posting : t.addComment}
            <Send className="size-4" />
          </Button>
        </div>
      )}

      {error ? (
        <p className="text-destructive text-xs">{error.message}</p>
      ) : loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (comments ?? []).length === 0 ? (
        <p className="text-muted-foreground text-xs">{t.noComments}</p>
      ) : (
        <div className="space-y-2">
          {(comments ?? []).map((comment) => {
            const name = fullName(
              comment.auteur?.name,
              comment.auteur?.lastname
            );
            const canDelete = canModerate || comment.auteur?.id === user?.id;
            return (
              <div
                key={comment.id}
                className="bg-muted/40 flex items-start gap-2.5 rounded-xl p-3"
              >
                <Avatar className="size-7">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {name.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">{name}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {formatDateTime(comment.dateCreation)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed whitespace-pre-wrap">
                    {comment.contenu}
                  </p>
                </div>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-7"
                    onClick={() => deleteMutation.mutate(comment.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
