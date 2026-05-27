import React, { useEffect, useRef, useState } from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptAction?: boolean;
  acceptLabel?: string;
}

export default function TermsModal({
  isOpen,
  onClose,
  onAccept,
  showAcceptAction = true,
  acceptLabel = 'Eu aceito'
}: TermsModalProps) {
  const [canAccept, setCanAccept] = useState(false);
  const termsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setCanAccept(false);
    requestAnimationFrame(() => {
      if (termsScrollRef.current) {
        termsScrollRef.current.scrollTop = 0;
      }
    });
  }, [isOpen]);

  const handleScroll = () => {
    const container = termsScrollRef.current;
    if (!container) return;

    const reachedBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 8;
    setCanAccept(reachedBottom);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6">
      <div className="w-full max-w-md bg-surface rounded-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <h3 className="text-white text-2xl font-bold leading-tight">Política de Privacidade e Termos de Uso</h3>
          <p className="text-text-muted text-sm mt-2">
            Leia até o final para consultar os termos do aplicativo.
          </p>
        </div>

        <div
          ref={termsScrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm leading-6 text-text-muted"
        >
          <section className="space-y-2">
            <h4 className="text-white text-base font-semibold">1. O que o Drip Finance faz</h4>
            <p>
              O Drip Finance organiza suas finanças pessoais, permitindo cadastrar carteiras, registrar receitas e despesas,
              acompanhar categorias, visualizar saldos e consultar estatísticas de uso.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-white text-base font-semibold">2. Quais dados são coletados</h4>
            <p>
              Ao criar uma conta, coletamos nome, e-mail, senha criptografada pelo provedor de autenticação e dados que você
              inserir no app, como carteiras, transações, categorias, preferências de tema e moeda, além de informações de
              perfil, quando fornecidas por você.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-white text-base font-semibold">3. Como os dados são usados</h4>
            <p>
              Usamos as informações para autenticar sua conta, armazenar seu histórico financeiro, exibir estatísticas,
              personalizar a experiência do aplicativo e manter a sincronização entre dispositivos.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-white text-base font-semibold">4. Compartilhamento e terceiros</h4>
            <p>
              Os dados são armazenados em serviços de infraestrutura e autenticação da Firebase/Google, utilizados para
              viabilizar o funcionamento do app. Não vendemos seus dados pessoais e não compartilhamos seu conteúdo financeiro
              com terceiros para fins comerciais.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-white text-base font-semibold">5. Responsabilidades do usuário</h4>
            <p>
              Você é responsável pela veracidade das informações cadastradas, pela confidencialidade de sua conta e pela
              atualização de dados que impactem seu uso do aplicativo. O uso indevido da conta, inclusive por terceiros, é de
              responsabilidade do titular.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-white text-base font-semibold">6. Segurança e limitações</h4>
            <p>
              Adotamos medidas razoáveis para proteger os dados armazenados, mas nenhum sistema é completamente invulnerável.
              O Drip Finance é uma ferramenta de organização financeira e não substitui consultoria contábil, fiscal ou
              financeira profissional.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-white text-base font-semibold">7. Exclusão e encerramento</h4>
            <p>
              Você pode solicitar a desativação ou exclusão da sua conta conforme os canais disponibilizados pelo aplicativo.
              Ao encerrar a conta, os dados associados poderão ser removidos ou mantidos apenas quando houver obrigação legal
              ou necessidade operacional legítima.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-white text-base font-semibold">8. Atualizações dos termos</h4>
            <p>
              Estes termos podem ser atualizados para refletir mudanças no produto, nos serviços de terceiros ou em requisitos
              legais. O uso contínuo do aplicativo após a publicação de novas versões representa concordância com os termos
              revisados.
            </p>
          </section>
        </div>

        <div className="px-6 py-5 border-t border-white/5 bg-surface/95 backdrop-blur-sm">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-full bg-text-muted/20 text-white font-semibold hover:bg-text-muted/30 transition-colors"
            >
              Fechar
            </button>
            {showAcceptAction && (
              <button
                type="button"
                onClick={onAccept}
                disabled={!canAccept}
                className="flex-1 h-12 rounded-full bg-primary text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {acceptLabel}
              </button>
            )}
          </div>
          {showAcceptAction && (
            <p className="text-[10px] text-text-muted text-center mt-3">
              O aceite só é liberado após você chegar ao fim do texto.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}