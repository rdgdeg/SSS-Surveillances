
import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Creneau, Session, SurveillantType, AvailabilityData, SurveillantTypeLabels, Surveillant, FormProgressData } from '../../types';
import { getActiveSessionWithCreneaux, findSurveillantByEmail, getExistingSubmission, getSurveillantByEmail } from '../../lib/api';
import * as submissionService from '../../lib/submissionService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shared/Select';
import { Checkbox } from '../shared/Checkbox';
import { User, Calendar, MessageSquare, Send, ArrowLeft, ArrowRight, Mail, Search, Lightbulb, AlertTriangle, Frown, RefreshCw, Plus, Loader2, Users, Check, Save, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebug } from '../../contexts/DebugContext';
import localStorageManager from '../../lib/localStorageManager';
import SubmissionHistoryModal from './SubmissionHistoryModal';

// --- Helper Functions ---

const groupCreneauxByDate = (creneaux: Creneau[]) => {
    const grouped = creneaux.reduce((acc, creneau) => {
        if (creneau.date_surveillance) {
            const date = creneau.date_surveillance;
            if (!acc[date]) acc[date] = [];
            acc[date].push(creneau);
        }
        return acc;
    }, {} as Record<string, Creneau[]>);
    
    // Trier les créneaux par heure de début dans chaque groupe
    Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => {
            const timeA = a.heure_debut_surveillance || '';
            const timeB = b.heure_debut_surveillance || '';
            return timeA.localeCompare(timeB);
        });
    });
    
    return grouped;
};

// --- Step Components (Optimized) ---

const Stepper: React.FC<{ currentStep: number; steps: string[] }> = memo(({ currentStep, steps }) => {
    const activeStep = currentStep > 0 ? currentStep : 1;
    return (
        <nav aria-label="Progress" className="mb-8">
            <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                {steps.map((stepName, stepIdx) => (
                    <li key={stepName} className="md:flex-1">
                        {stepIdx + 1 < activeStep ? (
                            <div className="group flex w-full flex-col border-l-4 border-indigo-600 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                                <span className="text-sm font-medium text-indigo-600 transition-colors">{`Étape ${stepIdx + 1}`}</span>
                                <span className="text-sm font-medium">{stepName}</span>
                            </div>
                        ) : stepIdx + 1 === activeStep ? (
                            <div className="flex w-full flex-col border-l-4 border-indigo-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4" aria-current="step">
                                <span className="text-sm font-medium text-indigo-600">{`Étape ${stepIdx + 1}`}</span>
                                <span className="text-sm font-medium">{stepName}</span>
                            </div>
                        ) : (
                            <div className="group flex w-full flex-col border-l-4 border-gray-200 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 dark:border-gray-700">
                                <span className="text-sm font-medium text-gray-500 transition-colors">{`Étape ${stepIdx + 1}`}</span>
                                <span className="text-sm font-medium">{stepName}</span>
                            </div>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
});

const SubmissionInfoBanner: React.FC<{ 
    submittedAt?: string; 
    updatedAt?: string; 
    modificationsCount?: number;
    onViewHistory?: () => void;
}> = memo(({ submittedAt, updatedAt, modificationsCount, onViewHistory }) => {
    if (!submittedAt) return null;
    
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };
    
    const isModified = updatedAt && updatedAt !== submittedAt;
    
    return (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        <span className="font-semibold">Première soumission :</span> {formatDate(submittedAt)}
                    </p>
                    {isModified && (
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <span className="font-semibold">Dernière modification :</span> {formatDate(updatedAt)}
                            {modificationsCount && modificationsCount > 0 && (
                                <span className="ml-2 text-xs bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded-full">
                                    {modificationsCount} modification{modificationsCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </p>
                    )}
                    {modificationsCount && modificationsCount > 0 && onViewHistory && (
                        <button
                            onClick={onViewHistory}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 flex items-center gap-1"
                        >
                            <Clock className="h-3 w-3" />
                            Voir l'historique complet
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

const EmailStep = memo<{ onEmailCheck: (e: React.FormEvent) => void; email: string; telephone: string; onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onTelephoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void; isChecking: boolean; hasExistingSubmission: boolean; isLocked?: boolean; lockMessage?: string; }>(({ onEmailCheck, email, telephone, onEmailChange, onTelephoneChange, isChecking, hasExistingSubmission, isLocked, lockMessage }) => (
    <div className="w-full max-w-4xl mx-auto py-4">
        <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {isLocked ? 'Consultation des Disponibilités' : 'Déclaration de Disponibilités'}
            </h1>
        </div>
        
        {isLocked && (
            <Card className="border-amber-400 dark:border-amber-600 shadow-lg mb-6">
                <CardHeader className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-full">
                            <svg className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <CardTitle className="text-2xl text-amber-800 dark:text-amber-300">
                            Les disponibilités sont verrouillées
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
                        <p className="text-blue-800 dark:text-blue-300">
                            {lockMessage || "L'établissement du planning est en cours et les attributions vont suivre."}
                        </p>
                    </div>
                </CardContent>
            </Card>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-indigo-100/50 dark:shadow-indigo-900/20 p-6 md:p-8 space-y-6">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                    {isLocked ? <Search className="h-8 w-8 text-indigo-600 dark:text-indigo-400" /> : <Mail className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {isLocked ? 'Consulter mes disponibilités' : 'Vérifiez votre email UCLouvain'}
                </h2>
            </div>

            <form onSubmit={onEmailCheck} className="space-y-5">
                <div>
                    <label htmlFor="email-check" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adresse email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        <Input 
                            id="email-check" 
                            name="email" 
                            type="email" 
                            placeholder="votre.nom@uclouvain.be" 
                            value={email} 
                            onChange={onEmailChange} 
                            required 
                            className="pl-10 h-12 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                        />
                    </div>
                </div>

                {!isLocked && (
                    <div>
                        <label htmlFor="telephone-check" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Numéro de GSM <span className="text-red-500">*</span>
                        </label>
                        <Input 
                            id="telephone-check" 
                            name="telephone" 
                            type="tel" 
                            placeholder="0470123456" 
                            value={telephone} 
                            onChange={onTelephoneChange} 
                            required 
                            className="h-12 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Ce numéro ne sera visible que par le secrétariat et utilisé uniquement en cas de changement de dernière minute ou pour vous contacter en cas d'absence.
                        </p>
                    </div>
                )}
                
                <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all" 
                    disabled={isChecking}
                >
                    {isChecking ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Vérification en cours...
                        </>
                    ) : (
                        <>
                            <Search className="mr-2 h-5 w-5" />
                            {isLocked ? 'Consulter mes disponibilités' : 'Vérifier mon email'}
                        </>
                    )}
                </Button>
            </form>

            <div className="border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-r-lg p-4 flex items-start space-x-3">
                <Lightbulb className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Conseil</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {hasExistingSubmission 
                            ? "Vous avez déjà soumis vos disponibilités. Vous pouvez les consulter et les modifier."
                            : "Utilisez votre adresse email officielle UCLouvain (@uclouvain.be) pour récupérer automatiquement vos informations."
                        }
                    </p>
                </div>
            </div>
        </div>
    </div>
));

const NotFoundStep = memo<{ onRetry: () => void; onManual: () => void; }>(({ onRetry, onManual }) => (
    <div className="max-w-2xl mx-auto">
        <Card className="border-orange-400 dark:border-orange-600 shadow-lg shadow-orange-500/10">
            <CardHeader className="flex-row items-center space-x-4 bg-orange-50 dark:bg-transparent p-4 border-b border-orange-200 dark:border-orange-600/50">
                <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-full text-orange-600 dark:text-orange-300 ring-4 ring-orange-50 dark:ring-orange-900/30">
                    <AlertTriangle className="h-8 w-8" />
                </div>
                <CardTitle className="text-orange-800 dark:text-orange-300 text-3xl">Email non reconnu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <div className="bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 p-4 rounded-lg flex items-start space-x-3">
                    <Frown className="h-6 w-6 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="font-medium text-blue-800 dark:text-blue-300">Votre email n'a pas été trouvé dans notre base de données.</p>
                </div>
                <div className="bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg space-y-3">
                    <p className="font-semibold flex items-center text-yellow-800 dark:text-yellow-300"><span className="text-2xl mr-2">👋</span> Que souhaitez-vous faire ?</p>
                    <Button variant="outline" className="w-full bg-white dark:bg-gray-700" onClick={onRetry}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Réessayer avec une autre adresse
                    </Button>
                    <Button className="w-full" onClick={onManual}>
                        <Plus className="mr-2 h-4 w-4" />
                        Continuer et remplir manuellement
                    </Button>
                    <p className="text-xs text-center text-gray-600 dark:text-gray-400 pt-2">Si vous continuez, vous devrez renseigner tous vos détails.</p>
                </div>
            </CardContent>
        </Card>
    </div>
));

type AvailabilityFormData = {
    email: string;
    nom: string;
    prenom: string;
    type_surveillant: SurveillantType;
    telephone: string;
    remarque_generale: string;
};

const InfoStep = memo<{ sessionName?: string; formData: AvailabilityFormData; onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; onSelectChange: (v: string) => void; onNext: () => void; }>(({ sessionName, formData, onInputChange, onSelectChange, onNext }) => (
    <>
        <h2 className="text-xl text-center text-gray-600 dark:text-gray-400 mb-6">{sessionName}</h2>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><User className="mr-2 h-6 w-6" /> Identification</CardTitle>
                <CardDescription>Veuillez entrer vos informations personnelles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input name="prenom" placeholder="Prénom" value={formData.prenom} onChange={onInputChange} required />
                <Input name="nom" placeholder="Nom" value={formData.nom} onChange={onInputChange} required />
                <Input name="email" type="email" placeholder="Email UCLouvain" value={formData.email} onChange={onInputChange} required disabled />
                <Input name="telephone" type="tel" placeholder="Numéro de GSM *" value={formData.telephone} onChange={onInputChange} required />
                <Select onValueChange={onSelectChange} defaultValue={formData.type_surveillant}>
                    <SelectTrigger><SelectValue placeholder="Type de surveillant" /></SelectTrigger>
                    <SelectContent>
                        {Object.entries(SurveillantTypeLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
            <CardFooter>
                <Button onClick={onNext} className="ml-auto">Suivant <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </CardFooter>
        </Card>
    </>
));

const AvailabilityStep = memo<{ sessionName?: string; selectedCount: number; groupedCreneaux: Record<string, Creneau[]>; availabilities: AvailabilityData; onAvailabilityChange: (id: string, available: boolean) => void; onPrev: () => void; onNext: () => void; surveillant: Surveillant | null; isModification?: boolean; submittedAt?: string; updatedAt?: string; modificationsCount?: number; onViewHistory?: () => void; isReadOnly?: boolean; }>(({ sessionName, selectedCount, groupedCreneaux, availabilities, onAvailabilityChange, onPrev, onNext, surveillant, isModification, submittedAt, updatedAt, modificationsCount, onViewHistory, isReadOnly }) => {
    const isFasbPat = surveillant?.type === SurveillantType.PAT && surveillant?.affectation_faculte === 'FASB';
    const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null);
    const [showScrollIndicator, setShowScrollIndicator] = useState(false);
    
    // Calculer le nombre total de créneaux
    const totalCreneaux = Object.values(groupedCreneaux).reduce((acc, creneaux) => acc + creneaux.length, 0);
    const totalDates = Object.keys(groupedCreneaux).length;
    
    // Vérifier si le contenu est scrollable
    useEffect(() => {
        if (scrollContainerRef) {
            const checkScroll = () => {
                const hasScroll = scrollContainerRef.scrollHeight > scrollContainerRef.clientHeight;
                const isAtBottom = scrollContainerRef.scrollHeight - scrollContainerRef.scrollTop <= scrollContainerRef.clientHeight + 10;
                setShowScrollIndicator(hasScroll && !isAtBottom);
            };
            
            checkScroll();
            scrollContainerRef.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            
            return () => {
                scrollContainerRef.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [scrollContainerRef, groupedCreneaux]);
    
    return (
    <>
        <h2 className="text-xl text-center text-gray-600 dark:text-gray-400 mb-6">{sessionName}</h2>
        <SubmissionInfoBanner submittedAt={submittedAt} updatedAt={updatedAt} modificationsCount={modificationsCount} onViewHistory={onViewHistory} />
        {isReadOnly && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-300">Mode consultation uniquement</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                            Les disponibilités sont verrouillées. Vous pouvez consulter vos disponibilités soumises mais ne pouvez plus les modifier.
                        </p>
                    </div>
                </div>
            </div>
        )}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-6 w-6" /> 
                    {isReadOnly ? 'Mes disponibilités (lecture seule)' : `Disponibilités ${isModification ? '(Modification)' : ''}`}
                </CardTitle>
                <CardDescription>
                    {isReadOnly ? (
                        <>Vous avez sélectionné <strong className="text-indigo-600 dark:text-indigo-400">{selectedCount}</strong> créneaux sur <strong className="text-indigo-600 dark:text-indigo-400">{totalCreneaux}</strong> disponibles ({totalDates} date{totalDates > 1 ? 's' : ''}).</>
                    ) : (
                        <>
                            {isModification && <span className="text-blue-600 dark:text-blue-400 font-medium">Vous modifiez vos disponibilités existantes. </span>}
                            Sélectionnez les créneaux pour lesquels vous êtes disponible. Vous avez sélectionné <strong className="text-indigo-600 dark:text-indigo-400">{selectedCount}</strong> créneaux sur <strong className="text-indigo-600 dark:text-indigo-400">{totalCreneaux}</strong> disponibles ({totalDates} date{totalDates > 1 ? 's' : ''}).
                        </>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative">
                <div ref={setScrollContainerRef} className="max-h-[75vh] overflow-y-auto pr-3 scroll-smooth">
                 <div className="space-y-4">
                    {isFasbPat && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 p-3 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold">Attention - Personnel FASB</h4>
                                <p className="text-sm">En tant que membre du personnel PAT de la faculté FASB, il est attendu que vous sélectionniez un minimum de 12 créneaux de disponibilité.</p>
                            </div>
                        </div>
                    )}
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 p-3 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">Information sur les créneaux</h4>
                                <p className="text-sm mt-1">
                                    Le chiffre <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"><Users className="h-3 w-3" />5</span> indique le nombre de surveillants théoriquement nécessaires pour ce créneau. 
                                    Cette information est donnée à titre indicatif pour vous aider à identifier les créneaux fortement sollicités. 
                                    Votre sélection n'affecte pas ce nombre.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                {Object.keys(groupedCreneaux).sort().map(date => {
                    const creneauxOnDate = groupedCreneaux[date];
                    return (
                        <div key={date}>
                            <h3 className="text-lg font-semibold mb-2 border-b pb-1 dark:border-gray-600">{new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                            <div className="space-y-2">
                                {creneauxOnDate.map(creneau => {
                                    const isChecked = availabilities[creneau.id]?.available;
                                    const nbSurveillants = creneau.nb_surveillants_requis;
                                    const hasHighDemand = nbSurveillants && nbSurveillants >= 5;
                                    
                                    return (
                                        <label htmlFor={`creneau-${creneau.id}`} key={creneau.id} className={`flex items-center p-3 rounded-lg border dark:border-gray-700 ${isReadOnly ? 'opacity-75' : 'cursor-pointer'} transition-all duration-200 ${isChecked ? 'bg-indigo-50 dark:bg-indigo-900/50 border-indigo-400 ring-1 ring-indigo-400' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                            <Checkbox id={`creneau-${creneau.id}`} checked={!!isChecked} onCheckedChange={(checked) => !isReadOnly && onAvailabilityChange(creneau.id, !!checked)} className={isReadOnly ? 'pointer-events-none' : ''} />
                                            <div className="ml-4 flex-1 flex justify-between items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{creneau.heure_debut_surveillance} - {creneau.heure_fin_surveillance}</span>
                                                    {nbSurveillants && (
                                                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                                            hasHighDemand 
                                                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' 
                                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                        }`} title="Nombre de surveillants nécessaires">
                                                            <Users className="h-3 w-3" />
                                                            {nbSurveillants}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {creneau.type_creneau === 'RESERVE' && <span className="text-xs font-semibold bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full">Réserve</span>}
                                                </div>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
                </div>
                
                {/* Indicateur de scroll */}
                {showScrollIndicator && (
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none flex items-end justify-center pb-2">
                        <div className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce pointer-events-auto">
                            <ArrowRight className="h-4 w-4 rotate-90" />
                            <span className="text-sm font-medium">Faites défiler pour voir plus de créneaux</span>
                            <ArrowRight className="h-4 w-4 rotate-90" />
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                {isReadOnly ? (
                    <Button onClick={onPrev} variant="outline" className="mx-auto">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour
                    </Button>
                ) : (
                    <>
                        <Button onClick={onPrev} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Précédent</Button>
                        <Button onClick={onNext}>Suivant <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </>
                )}
            </CardFooter>
        </Card>
    </>
)});

const ConfirmationStep = memo<{ sessionName?: string; formData: AvailabilityFormData; selectedCount: number; creneaux: Creneau[]; availabilities: AvailabilityData; onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; onReset: () => void; onPrev: () => void; onSubmit: (e: React.FormEvent) => void; isSubmitting: boolean; isModification: boolean; }>(({ sessionName, formData, selectedCount, creneaux, availabilities, onInputChange, onReset, onPrev, onSubmit, isSubmitting, isModification }) => (
    <>
        <h2 className="text-xl text-center text-gray-600 dark:text-gray-400 mb-6">{sessionName}</h2>
        {isModification && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 p-3 rounded-lg flex items-start gap-3">
                <RefreshCw className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                    <h4 className="font-semibold">Modification de vos disponibilités</h4>
                    <p className="text-sm">Vous êtes en train de modifier vos disponibilités existantes. Les changements remplaceront votre soumission précédente.</p>
                </div>
            </div>
        )}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Send className="mr-2 h-6 w-6" /> Récapitulatif et {isModification ? 'Modification' : 'Soumission'}</CardTitle>
                <CardDescription>Veuillez vérifier vos informations avant de {isModification ? 'modifier' : 'soumettre'}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Informations personnelles</h3>
                    <p className="text-gray-600 dark:text-gray-400">{formData.prenom} {formData.nom} ({formData.email}) - {SurveillantTypeLabels[formData.type_surveillant]}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Créneaux sélectionnés ({selectedCount})</h3>
                    {selectedCount > 0 ? (
                        <ul className="list-disc list-inside max-h-48 overflow-y-auto mt-2 text-gray-600 dark:text-gray-400">
                            {creneaux.filter(c => availabilities[c.id]?.available).map(c => (
                                <li key={c.id}>
                                    {c.date_surveillance ? new Date(c.date_surveillance + 'T00:00:00').toLocaleDateString('fr-FR') : 'Date non définie'} de {c.heure_debut_surveillance} à {c.heure_fin_surveillance}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-gray-500 italic mt-2">Aucun créneau sélectionné.</p>}
                </div>
                <div>
                    <h3 className="font-semibold mb-2 flex items-center"><MessageSquare className="mr-2 h-4 w-4" /> Remarque générale (optionnel)</h3>
                    <textarea name="remarque_generale" rows={4} placeholder="Ajouter une remarque (ex: préférences, contraintes)..." className="w-full p-2 border rounded-md bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={formData.remarque_generale} onChange={onInputChange} />
                </div>
            </CardContent>
            <CardFooter className="flex justify-between flex-wrap gap-2">
                <Button onClick={onReset} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-500/50 dark:hover:bg-red-900/20">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tout recommencer
                </Button>
                <div className="flex gap-2">
                    <Button onClick={onPrev} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Précédent</Button>
                    <Button onClick={onSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {isModification ? 'Mettre à jour mes disponibilités' : 'Soumettre mes disponibilités'}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    </>
));

const SuccessStep = memo<{ prenom?: string; sessionName?: string; onReset: () => void; }>(({ prenom, sessionName, onReset }) => (
    <Card className="text-center">
        <CardContent className="pt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-2xl">Soumission Réussie !</CardTitle>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Merci, {prenom}. Vos disponibilités pour la session <strong>{sessionName}</strong> ont bien été enregistrées.</p>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Vous recevrez un email de confirmation sous peu.</p>
        </CardContent>
        <CardFooter>
            <Button onClick={onReset} className="mx-auto">Effectuer une nouvelle soumission</Button>
        </CardFooter>
    </Card>
));

// --- Main Form Component ---

const AvailabilityForm: React.FC = () => {
    const [step, setStep] = useState(0); // 0: Email check, -1: Not found, 1: Personal, 2: Avail, 3: Confirm, 4: Success
    const [session, setSession] = useState<Session | null>(null);
    const [creneaux, setCreneaux] = useState<Creneau[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionAttempts, setSubmissionAttempts] = useState(0);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    
    const initialFormData: AvailabilityFormData = {
        email: '',
        nom: '',
        prenom: '',
        type_surveillant: SurveillantType.ASSISTANT,
        telephone: '',
        remarque_generale: ''
    };

    const [formData, setFormData] = useState(initialFormData);
    const [foundSurveillantId, setFoundSurveillantId] = useState<string | null>(null);
    const [foundSurveillant, setFoundSurveillant] = useState<Surveillant | null>(null);
    const [availabilities, setAvailabilities] = useState<AvailabilityData>({});
    const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null);
    const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
    const [submissionTimestamps, setSubmissionTimestamps] = useState<{ 
        submittedAt?: string; 
        updatedAt?: string; 
        modificationsCount?: number;
        history?: any[];
    }>({});
    
    const formSteps = ["Identification", "Disponibilités", "Confirmation"];
    const { setDebugData } = useDebug();

    useEffect(() => {
        setDebugData('AvailabilityForm', {
            step,
            isLoading,
            isCheckingEmail,
            isSubmitting,
            sessionName: session?.name,
            formData,
            availabilitiesSummary: {
                totalSlots: Object.keys(availabilities).length,
                // Fix: Used Object.keys to avoid type inference issues with Object.values.
                selectedSlots: Object.keys(availabilities).filter(id => availabilities[id].available).length,
            },
            foundSurveillant,
        });
    }, [step, isLoading, isCheckingEmail, isSubmitting, session, formData, availabilities, foundSurveillant, setDebugData]);


    // Vérifier la disponibilité du LocalStorage au chargement
    const [localStorageAvailable, setLocalStorageAvailable] = useState(true);
    const [hasRestoredData, setHasRestoredData] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                
                // Vérifier la disponibilité du LocalStorage
                const isLSAvailable = localStorageManager.isAvailable();
                setLocalStorageAvailable(isLSAvailable);
                
                if (!isLSAvailable) {
                    toast.error('Le stockage local n\'est pas disponible. Vos données ne seront pas sauvegardées automatiquement.', {
                        duration: 5000,
                        icon: '⚠️'
                    });
                }
                
                const data = await getActiveSessionWithCreneaux();
                if (data) {
                    setSession(data);
                    const sortedCreneaux = [...data.creneaux_surveillance].sort((a, b) => {
                        const dateA = a.date_surveillance || '';
                        const dateB = b.date_surveillance || '';
                        const timeA = a.heure_debut_surveillance || '';
                        const timeB = b.heure_debut_surveillance || '';
                        if (dateA !== dateB) return dateA.localeCompare(dateB);
                        return timeA.localeCompare(timeB);
                    });
                    setCreneaux(sortedCreneaux);
                    const initialAvailabilities: AvailabilityData = sortedCreneaux.reduce((acc, c) => ({ ...acc, [c.id]: { available: false } }), {});
                    setAvailabilities(initialAvailabilities);
                    
                    // Tenter de restaurer les données sauvegardées
                    if (isLSAvailable) {
                        const savedData = localStorageManager.loadFormProgress();
                        if (savedData && savedData.sessionId === data.id) {
                            // Restaurer les données
                            setFormData({
                                email: savedData.email,
                                nom: savedData.nom,
                                prenom: savedData.prenom,
                                type_surveillant: savedData.type_surveillant,
                                telephone: savedData.telephone || '',
                                remarque_generale: savedData.remarque_generale
                            });
                            setAvailabilities(savedData.availabilities);
                            setFoundSurveillantId(savedData.foundSurveillantId);
                            setHasRestoredData(true);
                            
                            toast.success('Vos données ont été restaurées !', {
                                duration: 4000,
                                icon: '💾'
                            });
                        }
                    }
                } else {
                    toast.error("Aucune session active trouvée.");
                }
            } catch (error) {
                toast.error("Erreur lors du chargement des données de la session.");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);
    
    // Sauvegarde automatique avec debounce via le LocalStorage Manager
    useEffect(() => {
        if (step > 0 && step < 4 && session && localStorageAvailable) {
            const progressData: FormProgressData = {
                email: formData.email,
                nom: formData.nom,
                prenom: formData.prenom,
                type_surveillant: formData.type_surveillant,
                telephone: formData.telephone,
                remarque_generale: formData.remarque_generale,
                availabilities,
                foundSurveillantId,
                lastSaved: new Date().toISOString(),
                sessionId: session.id
            };
            
            localStorageManager.saveFormProgress(progressData).catch(error => {
                if (error.message === 'QUOTA_EXCEEDED') {
                    toast.error('Espace de stockage local insuffisant. Vos données ne seront pas sauvegardées automatiquement.', {
                        duration: 5000,
                        icon: '⚠️'
                    });
                    setLocalStorageAvailable(false);
                }
            });
        }
    }, [formData, availabilities, step, foundSurveillantId, session, localStorageAvailable]);

    // Confirmation avant navigation si des modifications non sauvegardées existent
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Ne pas afficher la confirmation si on est à l'étape de succès (step 4)
            if (step === 4) {
                return;
            }

            // Vérifier s'il y a des données non soumises
            const hasUnsavedData = step > 0 && step < 4 && (
                formData.email || 
                formData.nom || 
                formData.prenom || 
                Object.values(availabilities).some(a => a.available)
            );

            if (hasUnsavedData) {
                e.preventDefault();
                e.returnValue = ''; // Chrome nécessite returnValue
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [step, formData, availabilities]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, type_surveillant: value as SurveillantType }));
    };

    const handleAvailabilityChange = (creneauId: string, available: boolean) => {
        setAvailabilities(prev => ({ ...prev, [creneauId]: { available } }));
    };
    
    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handleEmailCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation du téléphone uniquement si pas en mode lecture seule
        if (!session?.lock_submissions && (!formData.telephone || formData.telephone.trim() === '')) {
            toast.error('Veuillez renseigner votre numéro de GSM');
            return;
        }
        
        setIsCheckingEmail(true);
        try {
            if (!session) {
                toast.error("Session non trouvée.");
                return;
            }

            // Vérifier s'il existe une soumission existante
            const existingSubmission = await getExistingSubmission(session.id, formData.email.toLowerCase().trim());
            
            if (existingSubmission) {
                console.log('📋 Soumission existante trouvée:', {
                    id: existingSubmission.id,
                    email: existingSubmission.email,
                    deleted_at: existingSubmission.deleted_at,
                    nb_disponibilites: existingSubmission.historique_disponibilites?.length || 0
                });
                
                // Charger les données de la soumission existante
                setExistingSubmissionId(existingSubmission.id);
                setHasExistingSubmission(true);
                setFormData(prev => ({
                    ...prev,
                    nom: existingSubmission.nom,
                    prenom: existingSubmission.prenom,
                    type_surveillant: existingSubmission.type_surveillant as SurveillantType,
                    telephone: existingSubmission.telephone || '',
                    remarque_generale: existingSubmission.remarque_generale || ''
                }));
                
                // Charger les timestamps et l'historique
                setSubmissionTimestamps({
                    submittedAt: existingSubmission.submitted_at,
                    updatedAt: existingSubmission.updated_at,
                    modificationsCount: existingSubmission.historique_modifications?.length || 0,
                    history: existingSubmission.historique_modifications || []
                });
                
                // Charger les disponibilités existantes
                const existingAvailabilities: AvailabilityData = {};
                if (existingSubmission.historique_disponibilites && Array.isArray(existingSubmission.historique_disponibilites)) {
                    console.log('📅 Chargement de', existingSubmission.historique_disponibilites.length, 'disponibilités');
                    existingSubmission.historique_disponibilites.forEach((disp: any) => {
                        existingAvailabilities[disp.creneau_id] = { available: disp.est_disponible };
                    });
                }
                console.log('✅ Disponibilités chargées:', Object.keys(existingAvailabilities).filter(id => existingAvailabilities[id].available).length, 'créneaux sélectionnés');
                setAvailabilities(prev => ({ ...prev, ...existingAvailabilities }));
                
                // Vérifier si c'est aussi un surveillant enregistré
                const found = await findSurveillantByEmail(formData.email.toLowerCase().trim());
                if (found) {
                    setFoundSurveillant(found);
                    setFoundSurveillantId(found.id);
                }
                
                // Si verrouillé, afficher en lecture seule
                if (session.lock_submissions) {
                    toast.success('Vos disponibilités ont été chargées en lecture seule.', { duration: 4000 });
                } else {
                    toast.success('Vos disponibilités ont été chargées ! Vous pouvez les modifier.', { duration: 4000 });
                }
                setStep(2);
            } else {
                console.log('❌ Aucune soumission existante trouvée pour', formData.email);
                // Pas de soumission existante, vérifier si c'est un surveillant enregistré
                const found = await findSurveillantByEmail(formData.email.toLowerCase().trim());
                if (found) {
                    setFoundSurveillant(found);
                    setFormData(prev => ({ ...prev, nom: found.nom, prenom: found.prenom, type_surveillant: found.type as SurveillantType, telephone: found.telephone || '' }));
                    setFoundSurveillantId(found.id);
                    toast.success('Email reconnu ! Vos informations ont été pré-remplies.');
                    setStep(2);
                } else {
                    setFoundSurveillant(null);
                    toast.error('Email non reconnu. Veuillez renseigner vos informations manuellement.');
                    setStep(-1);
                }
            }
        } catch (error) {
            toast.error("Une erreur est survenue lors de la vérification.");
            setStep(-1);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return toast.error("Session non trouvée. Impossible de soumettre.");
        const surveillantByEmail = await getSurveillantByEmail(formData.email.trim().toLowerCase());
        if (surveillantByEmail && !surveillantByEmail.is_active) {
            toast.error("Votre compte surveillant est désactivé. Vous ne pouvez pas soumettre de disponibilités.");
            return;
        }
        setIsSubmitting(true);
        
        try {
            const visibleIds = new Set(visibleCreneaux.map(c => c.id));
            const payload = {
                session_id: session.id,
                surveillant_id: foundSurveillantId,
                ...formData,
                availabilities: Object.entries(availabilities)
                  .filter(([creneauId, val]) => val.available && visibleIds.has(creneauId))
                  .map(([creneauId]) => ({ creneau_id: creneauId, est_disponible: true })),
            };

            const result = await submissionService.submit(payload);
            
            if (result.success) {
                // LocalStorage est déjà nettoyé par le service
                const successMessage = hasExistingSubmission 
                    ? 'Vos disponibilités ont été mises à jour avec succès !' 
                    : 'Vos disponibilités ont été soumises avec succès !';
                toast.success(successMessage);
                nextStep();
            } else if (result.queued) {
                // Soumission mise en file d'attente (offline ou échec après retries)
                toast.success(result.message, { duration: 6000 });
            } else {
                // Échec de la soumission
                const errorMessage = result.errors && result.errors.length > 0
                    ? result.errors.join(', ')
                    : result.message;
                toast.error(errorMessage);
            }
        } catch(error) {
            console.error('Erreur lors de la soumission:', error);
            toast.error("Erreur inattendue lors de la soumission du formulaire.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleReset = () => {
        setFormData(initialFormData);
        const initialAvailabilities: AvailabilityData = creneaux.reduce((acc, c) => ({ ...acc, [c.id]: { available: false } }), {});
        setAvailabilities(initialAvailabilities);
        
        // Nettoyer le LocalStorage
        localStorageManager.clearFormProgress();
        
        setFoundSurveillantId(null);
        setFoundSurveillant(null);
        setExistingSubmissionId(null);
        setHasExistingSubmission(false);
        setSubmissionTimestamps({});
        setHasRestoredData(false);
        toast('Formulaire réinitialisé.', { icon: '🔄' });
        setStep(0);
    };

    // Type du surveillant (reconnu par email ou saisi manuellement) pour filtrer les créneaux visibles
    const userType = foundSurveillant?.type ?? formData.type_surveillant;
    // Créneaux visibles selon le type : "visible par tous" OU "jobistes uniquement" si la personne est jobiste
    const visibleCreneaux = useMemo(() => 
        creneaux.filter(c => !c.visible_jobistes_uniquement || userType === 'jobiste'),
        [creneaux, userType]
    );
    
    const renderStep = () => {
        const groupedCreneaux = groupCreneauxByDate(visibleCreneaux);
        const selectedCount = visibleCreneaux.filter(c => availabilities[c.id]?.available).length;

        switch (step) {
            case 0: return <EmailStep onEmailCheck={handleEmailCheck} email={formData.email} telephone={formData.telephone} onEmailChange={handleInputChange} onTelephoneChange={handleInputChange} isChecking={isCheckingEmail} hasExistingSubmission={hasExistingSubmission} isLocked={session?.lock_submissions} lockMessage={session?.lock_message} />;
            case -1: return <NotFoundStep onRetry={() => { setFormData(prev => ({ ...prev, email: '' })); setHasExistingSubmission(false); setStep(0);}} onManual={() => setStep(1)} />;
            case 1: return <InfoStep sessionName={session?.name} formData={formData} onInputChange={handleInputChange} onSelectChange={handleSelectChange} onNext={nextStep} />;
            case 2: return <AvailabilityStep sessionName={session?.name} selectedCount={selectedCount} groupedCreneaux={groupedCreneaux} availabilities={availabilities} onAvailabilityChange={handleAvailabilityChange} onPrev={foundSurveillant || hasExistingSubmission ? () => setStep(0) : prevStep} onNext={session?.lock_submissions ? () => setStep(0) : nextStep} surveillant={foundSurveillant} isModification={hasExistingSubmission} submittedAt={submissionTimestamps.submittedAt} updatedAt={submissionTimestamps.updatedAt} modificationsCount={submissionTimestamps.modificationsCount} onViewHistory={() => setShowHistoryModal(true)} isReadOnly={session?.lock_submissions} />;
            case 3: return <ConfirmationStep sessionName={session?.name} formData={formData} selectedCount={selectedCount} creneaux={visibleCreneaux} availabilities={availabilities} onInputChange={handleInputChange} onReset={handleReset} onPrev={prevStep} onSubmit={handleSubmit} isSubmitting={isSubmitting} isModification={hasExistingSubmission} />;
            case 4: return <SuccessStep prenom={formData.prenom} sessionName={session?.name} onReset={handleReset} />;
            default: return null;
        }
    };
    
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" aria-label="Loading" />
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">Chargement de la session...</p>
      </div>
    );

    if (!session) return <div className="text-center text-red-500">Aucune session active n'a pu être chargée. Veuillez contacter l'administrateur.</div>;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Avertissement si LocalStorage non disponible */}
            {!localStorageAvailable && step > 0 && step < 4 && (
                <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Sauvegarde automatique désactivée</h4>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                                Le stockage local n'est pas disponible. Vos données ne seront pas sauvegardées automatiquement. 
                                Veuillez compléter le formulaire en une seule session.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Indicateur de données restaurées */}
            {hasRestoredData && step > 0 && step < 4 && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Save className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="font-semibold text-green-800 dark:text-green-300">Données restaurées</h4>
                            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                Vos données précédentes ont été restaurées. Vous pouvez continuer où vous vous étiez arrêté.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {step > 0 && step < 4 && <Stepper currentStep={step} steps={formSteps} />}
            {renderStep()}
            
            {/* Modal d'historique */}
            <SubmissionHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                history={submissionTimestamps.history || []}
                submittedAt={submissionTimestamps.submittedAt || ''}
            />
        </div>
    );
};

export default AvailabilityForm;
