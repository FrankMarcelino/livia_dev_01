'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  validateCPF,
  validateEmail,
  validatePhone,
  formatCPF,
  formatPhone,
} from '@/lib/utils/validators';
import type { Contact } from '@/types/database';

interface CustomerDataPanelProps {
  contactId: string;
  tenantId: string;
}

export function CustomerDataPanel({
  contactId,
  tenantId,
}: CustomerDataPanelProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Estados dos campos
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phoneSecondary, setPhoneSecondary] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Validações
  const [emailError, setEmailError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Debounce para auto-save (800ms)
  const [debouncedName] = useDebounce(name, 800);
  const [debouncedEmail] = useDebounce(email, 800);
  const [debouncedCpf] = useDebounce(cpf, 800);
  const [debouncedPhoneSecondary] = useDebounce(phoneSecondary, 800);
  const [debouncedAddressStreet] = useDebounce(addressStreet, 800);
  const [debouncedAddressNumber] = useDebounce(addressNumber, 800);
  const [debouncedAddressComplement] = useDebounce(addressComplement, 800);
  const [debouncedCity] = useDebounce(city, 800);
  const [debouncedZipCode] = useDebounce(zipCode, 800);

  // Carregar dados do contato
  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/contacts/${contactId}?tenantId=${tenantId}`
      );
      if (!response.ok) throw new Error('Erro ao carregar contato');

      const data = await response.json();
      const contactData = data.data as Contact;

      setContact(contactData);
      setName(contactData.name || '');
      setEmail(contactData.email || '');
      setCpf(contactData.cpf || '');
      setPhoneSecondary(contactData.phone_secondary || '');
      setAddressStreet(contactData.address_street || '');
      setAddressNumber(contactData.address_number || '');
      setAddressComplement(contactData.address_complement || '');
      setCity(contactData.city || '');
      setZipCode(contactData.zip_code || '');
    } catch (error) {
      console.error('Erro ao carregar contato:', error);
      toast.error('Erro ao carregar dados do contato');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save quando campos mudam (debounced)
  useEffect(() => {
    if (!contact || isLoading) return;

    // Validar antes de salvar
    let hasErrors = false;

    if (debouncedEmail && !validateEmail(debouncedEmail)) {
      setEmailError('Email inválido');
      hasErrors = true;
    } else {
      setEmailError('');
    }

    if (debouncedCpf && !validateCPF(debouncedCpf)) {
      setCpfError('CPF inválido');
      hasErrors = true;
    } else {
      setCpfError('');
    }

    if (debouncedPhoneSecondary && !validatePhone(debouncedPhoneSecondary)) {
      setPhoneError('Telefone inválido');
      hasErrors = true;
    } else {
      setPhoneError('');
    }

    if (hasErrors) return;

    // Verificar se algo mudou
    const hasChanges =
      debouncedName !== (contact.name || '') ||
      debouncedEmail !== (contact.email || '') ||
      debouncedCpf !== (contact.cpf || '') ||
      debouncedPhoneSecondary !== (contact.phone_secondary || '') ||
      debouncedAddressStreet !== (contact.address_street || '') ||
      debouncedAddressNumber !== (contact.address_number || '') ||
      debouncedAddressComplement !== (contact.address_complement || '') ||
      debouncedCity !== (contact.city || '') ||
      debouncedZipCode !== (contact.zip_code || '');

    if (hasChanges) {
      saveContact();
    }
  }, [
    debouncedName,
    debouncedEmail,
    debouncedCpf,
    debouncedPhoneSecondary,
    debouncedAddressStreet,
    debouncedAddressNumber,
    debouncedAddressComplement,
    debouncedCity,
    debouncedZipCode,
  ]);

  const saveContact = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: debouncedName,
          email: debouncedEmail || null,
          cpf: debouncedCpf || null,
          phone_secondary: debouncedPhoneSecondary || null,
          address_street: debouncedAddressStreet || null,
          address_number: debouncedAddressNumber || null,
          address_complement: debouncedAddressComplement || null,
          city: debouncedCity || null,
          zip_code: debouncedZipCode || null,
          tenantId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      const data = await response.json();
      setContact(data.data);
      toast.success('Dados salvos automaticamente');
    } catch (error) {
      console.error('Erro ao salvar contato:', error);
      toast.error('Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyData = () => {
    if (!contact) return;

    const data = [
      `Nome: ${contact.name}`,
      contact.phone ? `Telefone: ${formatPhone(contact.phone)}` : null,
      contact.phone_secondary
        ? `Telefone 2: ${formatPhone(contact.phone_secondary)}`
        : null,
      contact.email ? `Email: ${contact.email}` : null,
      contact.cpf ? `CPF: ${formatCPF(contact.cpf)}` : null,
      contact.address_street
        ? `Endereço: ${contact.address_street}${contact.address_number ? `, ${contact.address_number}` : ''}`
        : null,
      contact.address_complement
        ? `Complemento: ${contact.address_complement}`
        : null,
      contact.city ? `Cidade: ${contact.city}` : null,
      contact.zip_code ? `CEP: ${contact.zip_code}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(data);
    setCopied(true);
    toast.success('Dados copiados para área de transferência');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">
          Erro ao carregar dados do contato
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Dados do Cliente</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyData}
          disabled={copied}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </>
          )}
        </Button>
      </div>

      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Salvando...
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            aria-invalid={!!emailError}
          />
          {emailError && (
            <p className="text-xs text-destructive mt-1">{emailError}</p>
          )}
        </div>

        <div>
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="000.000.000-00"
            aria-invalid={!!cpfError}
          />
          {cpfError && (
            <p className="text-xs text-destructive mt-1">{cpfError}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Telefone Principal</Label>
          <Input
            id="phone"
            value={formatPhone(contact.phone)}
            disabled
            className="bg-muted"
          />
        </div>

        <div>
          <Label htmlFor="phone_secondary">Telefone Secundário</Label>
          <Input
            id="phone_secondary"
            value={phoneSecondary}
            onChange={(e) => setPhoneSecondary(e.target.value)}
            placeholder="(00) 00000-0000"
            aria-invalid={!!phoneError}
          />
          {phoneError && (
            <p className="text-xs text-destructive mt-1">{phoneError}</p>
          )}
        </div>

        <div>
          <Label htmlFor="address_street">Endereço</Label>
          <Input
            id="address_street"
            value={addressStreet}
            onChange={(e) => setAddressStreet(e.target.value)}
            placeholder="Rua, avenida..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="address_number">Número</Label>
            <Input
              id="address_number"
              value={addressNumber}
              onChange={(e) => setAddressNumber(e.target.value)}
              placeholder="123"
            />
          </div>
          <div>
            <Label htmlFor="address_complement">Complemento</Label>
            <Input
              id="address_complement"
              value={addressComplement}
              onChange={(e) => setAddressComplement(e.target.value)}
              placeholder="Apto, bloco..."
            />
          </div>
        </div>

        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="São Paulo"
          />
        </div>

        <div>
          <Label htmlFor="zip_code">CEP</Label>
          <Input
            id="zip_code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="00000-000"
          />
        </div>
      </div>
    </div>
  );
}
