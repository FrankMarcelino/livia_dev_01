import { Skeleton } from '@/components/ui/skeleton';

export function MessagesSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Mensagem do bot (esquerda) */}
      <div className="flex justify-start">
        <div className="max-w-[70%] space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-64 rounded-2xl" />
        </div>
      </div>

      {/* Mensagem do usuário (direita) */}
      <div className="flex justify-end">
        <div className="max-w-[70%] space-y-2">
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>
      </div>

      {/* Mensagem do bot (esquerda) */}
      <div className="flex justify-start">
        <div className="max-w-[70%] space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-20 w-72 rounded-2xl" />
        </div>
      </div>

      {/* Mensagem do usuário (direita) */}
      <div className="flex justify-end">
        <div className="max-w-[70%] space-y-2">
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-14 w-56 rounded-2xl" />
        </div>
      </div>

      {/* Mensagem do bot (esquerda) */}
      <div className="flex justify-start">
        <div className="max-w-[70%] space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-60 rounded-2xl" />
        </div>
      </div>

      {/* Mensagem do usuário (direita) */}
      <div className="flex justify-end">
        <div className="max-w-[70%] space-y-2">
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-16 w-52 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
