'use client';

import { useState, useMemo } from 'react';
import type { TagForManagement } from '@/lib/queries/tags-crud';
import { TagCard } from './tag-card';
import { TagFormDialog } from './tag-form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Plus, Search, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface TagsManagerProps {
  initialTags: TagForManagement[];
  tenantId: string;
}

const TAG_TYPE_LABELS: Record<string, string> = {
  description: 'Intenção',
  success: 'Checkout',
  fail: 'Falha',
};

const TAG_TYPE_ORDER = ['description', 'success', 'fail'];

export function TagsManager({ initialTags, tenantId }: TagsManagerProps) {
  const [tags, setTags] = useState<TagForManagement[]>(initialTags);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagForManagement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter tags by search
  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags;
    const term = search.toLowerCase();
    return tags.filter(
      (tag) =>
        tag.tag_name.toLowerCase().includes(term) ||
        tag.prompt_to_ai?.toLowerCase().includes(term)
    );
  }, [tags, search]);

  // Group by type
  const groupedTags = useMemo(() => {
    const groups: Record<string, TagForManagement[]> = {};
    for (const type of TAG_TYPE_ORDER) {
      groups[type] = filteredTags.filter((t) => t.tag_type === type);
    }
    return groups;
  }, [filteredTags]);

  async function refreshTags() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/configuracoes/tags?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Erro ao carregar tags');
      const result = await response.json();
      setTags(result.data);
    } catch {
      toast.error('Erro ao carregar tags');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateNew() {
    setEditingTag(null);
    setDialogOpen(true);
  }

  function handleEdit(tag: TagForManagement) {
    setEditingTag(tag);
    setDialogOpen(true);
  }

  async function handleDelete(tag: TagForManagement) {
    try {
      const response = await fetch(`/api/configuracoes/tags/${tag.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar tag');
      }

      toast.success('Tag deletada com sucesso');
      await refreshTags();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar tag';
      toast.error(message);
    }
  }

  function handleFormSuccess() {
    toast.success(editingTag ? 'Tag atualizada com sucesso' : 'Tag criada com sucesso');
    refreshTags();
  }

  const totalTenant = tags.filter((t) => !t.isInherited).length;
  const totalInherited = tags.filter((t) => t.isInherited).length;

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
            <p className="text-muted-foreground">
              Gerencie as tags do seu tenant ({totalTenant} próprias, {totalInherited} herdadas)
            </p>
          </div>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Tag
          </Button>
        </div>

        <Separator />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tags por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tags grouped by type */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Tag className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">Nenhuma tag encontrada</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? 'Tente buscar por outro termo'
                : 'Crie sua primeira tag clicando no botão acima'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {TAG_TYPE_ORDER.map((type) => {
              const typeTags = groupedTags[type];
              if (!typeTags || typeTags.length === 0) return null;

              return (
                <div key={type}>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    {TAG_TYPE_LABELS[type]}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({typeTags.length})
                    </span>
                  </h2>
                  <div className="space-y-2">
                    {typeTags.map((tag) => (
                      <TagCard
                        key={tag.id}
                        tag={tag}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit dialog */}
      <TagFormDialog
        key={editingTag?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tag={editingTag}
        tenantId={tenantId}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
