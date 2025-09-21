import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, Building2, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { useVerifyCompanyPassword } from '@/hooks/useFiscalData';

interface PasswordChangeAuthProps {
  companyName: string;
  companyId: string;
  operation: 'change' | 'remove';
  onSuccess: () => void;
  onCancel: () => void;
}

interface PasswordForm {
  currentPassword: string;
}

const getOperationInfo = (operation: string) => {
  switch (operation) {
    case 'change':
      return {
        title: 'Alterar Senha',
        description: 'Para alterar a senha desta empresa, confirme sua senha atual.',
        icon: <Shield className="h-5 w-5" />
      };
    case 'remove':
      return {
        title: 'Remover Senha',
        description: 'Para remover a senha desta empresa, confirme sua senha atual.',
        icon: <Shield className="h-5 w-5" />
      };
    default:
      return {
        title: 'Operação Protegida',
        description: 'Para realizar esta operação, confirme sua senha atual.',
        icon: <Shield className="h-5 w-5" />
      };
  }
};

export const PasswordChangeAuth = ({ 
  companyName, 
  companyId, 
  operation, 
  onSuccess, 
  onCancel 
}: PasswordChangeAuthProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordForm>();
  const verifyPasswordMutation = useVerifyCompanyPassword();

  const operationInfo = getOperationInfo(operation);

  const onSubmit = async (data: PasswordForm) => {
    setError(null);
    
    verifyPasswordMutation.mutate({
      companyId,
      password: data.currentPassword
    }, {
      onSuccess: (isValid) => {
        if (isValid) {
          onSuccess();
          toast({
            title: "Senha confirmada",
            description: `Senha atual confirmada para ${companyName}.`,
          });
        } else {
          setError('Senha atual incorreta. Verifique a senha e tente novamente.');
        }
      },
      onError: () => {
        setError('Erro ao verificar senha. Tente novamente.');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <div className="p-2 rounded-lg bg-primary/10">
          {operationInfo.icon}
        </div>
        <div>
          <p className="font-medium">{operationInfo.title}</p>
          <p className="text-sm text-muted-foreground">{companyName}</p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
        <div className="flex items-start gap-2">
          <Lock className="h-4 w-4 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-100">Confirmação Necessária</p>
            <p className="text-amber-700 dark:text-amber-300">
              {operationInfo.description}
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Senha Atual</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPassword ? "text" : "password"}
              {...register('currentPassword', { 
                required: 'Senha atual é obrigatória',
                minLength: { value: 1, message: 'Senha não pode estar vazia' }
              })}
              placeholder="Digite sua senha atual"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.currentPassword && (
            <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={verifyPasswordMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={verifyPasswordMutation.isPending}
          >
            {verifyPasswordMutation.isPending ? 'Verificando...' : 'Confirmar'}
          </Button>
        </div>
      </form>
    </div>
  );
};
