import React from 'react';

interface ExamenPlanningBadgesProps {
  /** Nombre d'auditoires structurés (table examen_auditoires) */
  nbAuditoires: number;
  /** Champ texte auditoires sur l'examen */
  auditoiresTexte?: string | null;
  totalRequis: number;
  totalAttribues: number;
}

function badgeClass(tone: 'neutral' | 'ok' | 'warn' | 'error') {
  const map = {
    neutral: 'bg-gray-100 text-gray-600 border-gray-200',
    ok: 'bg-green-100 text-green-800 border-green-200',
    warn: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  };
  return `inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${map[tone]}`;
}

export function ExamenPlanningBadges({
  nbAuditoires,
  auditoiresTexte,
  totalRequis,
  totalAttribues,
}: ExamenPlanningBadgesProps) {
  const hasAuditoires =
    nbAuditoires > 0 || Boolean(auditoiresTexte?.trim());

  const auditoiresTone = hasAuditoires ? 'ok' : 'error';
  const auditoiresLabel =
    nbAuditoires > 0
      ? `Auditoires ${nbAuditoires}`
      : hasAuditoires
        ? 'Auditoires'
        : 'Auditoires';

  let survTone: 'neutral' | 'ok' | 'error' = 'neutral';
  let survLabel = 'Surveillants';
  let survTitle = 'Aucun auditoire configuré';

  if (hasAuditoires && totalRequis > 0) {
    const complet = totalAttribues >= totalRequis;
    survTone = complet ? 'ok' : 'error';
    survLabel = complet ? 'Surv. complet' : 'Surv. incomplet';
    survTitle = complet
      ? `${totalAttribues}/${totalRequis} surveillants attribués`
      : totalAttribues === 0
        ? `Aucun surveillant attribué (${totalRequis} requis)`
        : `${totalAttribues}/${totalRequis} surveillants attribués`;
  } else if (hasAuditoires && totalRequis === 0) {
    survTone = 'error';
    survLabel = 'Surv. incomplet';
    survTitle = 'Auditoires sans effectif de surveillants défini';
  }

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Statut auditoires et surveillants">
      <span
        className={badgeClass(auditoiresTone)}
        title={
          hasAuditoires
            ? nbAuditoires > 0
              ? `${nbAuditoires} auditoire(s) structuré(s)`
              : 'Auditoires renseignés (texte)'
            : 'Aucun auditoire renseigné'
        }
      >
        {auditoiresLabel}
      </span>
      <span className={badgeClass(survTone)} title={survTitle}>
        {survLabel}
      </span>
    </div>
  );
}
