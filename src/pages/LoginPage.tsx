import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpenCheck, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api, getErrorMessage } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import type { AuthPayload } from '../types';

const loginSchema = z.object({
  email: z.string().trim().email('Digite um e-mail válido.'),
  password: z.string().min(1, 'Digite sua senha.'),
});
type LoginFields = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  if (isAuthenticated) return <Navigate to="/provas" replace />;

  async function onSubmit(values: LoginFields) {
    setSubmitting(true);
    try {
      const response = await api.post<AuthPayload>('/sessions', values);
      login(response.data);
      toast.success(`Bem-vindo(a), ${response.data.user.name.split(' ')[0]}!`);
      navigate('/provas', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Não foi possível entrar. Confira seus dados.'));
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="login-shell">
    <section className="login-story">
      <div className="login-story-inner">
        <div className="brand-lockup brand-lockup-light"><div className="brand-mark"><BookOpenCheck size={23} strokeWidth={2.2} /></div><div><strong>provas<span>.</span></strong><small>GESTÃO ESCOLAR</small></div></div>
        <div className="story-content">
          <div className="story-eyebrow"><Sparkles size={15} /> MAIS ORGANIZAÇÃO, MAIS TEMPO</div>
          <h1>Todo o processo de provas, <em>em um só lugar.</em></h1>
          <p>Uma rotina escolar mais simples começa com tudo organizado. Gerencie provas e turmas com praticidade e segurança.</p>
          <div className="story-highlights">
            <div className="story-highlight"><div className="highlight-icon"><ClipboardIcon /></div><div><strong>Provas organizadas</strong><span>Arquivos e informações sempre à mão.</span></div></div>
            <div className="story-highlight"><div className="highlight-icon"><ShieldCheck size={20} /></div><div><strong>Acesso por perfil</strong><span>Cada pessoa acessa o que precisa.</span></div></div>
          </div>
        </div>
        <div className="login-story-foot"><span className="tiny-dot" /> Feito para a rotina da sua escola</div>
      </div>
      <div className="story-orb story-orb-one" /><div className="story-orb story-orb-two" />
    </section>
    <section className="login-form-panel">
      <div className="login-form-wrap">
        <div className="mobile-login-brand brand-lockup"><div className="brand-mark"><BookOpenCheck size={23} /></div><div><strong>provas<span>.</span></strong><small>GESTÃO ESCOLAR</small></div></div>
        <div className="login-welcome"><div className="welcome-label">ÁREA RESTRITA</div><h2>Que bom ter você aqui!</h2><p>Entre com seus dados para acessar sua conta.</p></div>
        <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
          <div className="field-group"><label htmlFor="email">E-mail</label><div className={`input-with-icon ${errors.email ? 'input-invalid' : ''}`}><Mail size={18} /><input id="email" type="email" autoComplete="username" placeholder="seuemail@escola.com.br" {...register('email')} /></div>{errors.email && <small className="field-error">{errors.email.message}</small>}</div>
          <div className="field-group"><div className="field-label-row"><label htmlFor="password">Senha</label></div><div className={`input-with-icon ${errors.password ? 'input-invalid' : ''}`}><LockKeyhole size={18} /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" {...register('password')} /><button className="password-toggle" type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <small className="field-error">{errors.password.message}</small>}</div>
          <button className="btn btn-primary login-submit" disabled={submitting} type="submit">{submitting ? <><span className="spinner spinner-white" /> Entrando...</> : <>Entrar na plataforma <span aria-hidden="true">→</span></>}</button>
        </form>
        <div className="login-protection"><ShieldCheck size={16} /><span>Conexão segura. Seus dados são protegidos.</span></div>
        <p className="login-help">Precisa de acesso? Entre em contato com a coordenação da sua escola.</p>
      </div>
      <div className="login-bottom">© {new Date().getFullYear()} Provas · Sistema de Gestão Escolar</div>
    </section>
  </div>;
}

function ClipboardIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3"/></svg>;
}
