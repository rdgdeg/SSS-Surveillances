# Requirements Document

## Introduction

Cette fonctionnalité permet aux administrateurs de gérer la capacité des créneaux de surveillance en définissant le nombre de surveillants nécessaires par créneau et en visualisant le taux de remplissage pour identifier les créneaux problématiques.

## Glossary

- **Créneau**: Une plage horaire de surveillance pour un examen
- **Capacité requise**: Le nombre de surveillants nécessaires pour un créneau donné
- **Disponibilités**: Les créneaux pour lesquels un surveillant s'est déclaré disponible
- **Taux de remplissage**: Le ratio entre le nombre de surveillants disponibles et la capacité requise pour un créneau
- **Créneau critique**: Un créneau dont le taux de remplissage est inférieur à 100%
- **Système**: L'application de gestion des disponibilités de surveillance

## Requirements

### Requirement 1

**User Story:** En tant qu'administrateur, je veux définir le nombre de surveillants nécessaires pour chaque créneau, afin de planifier correctement les surveillances.

#### Acceptance Criteria

1. WHEN l'administrateur accède à la page de gestion des créneaux, THE Système SHALL afficher une colonne "Nombre de surveillants requis" pour chaque créneau
2. WHEN l'administrateur clique sur le champ "Nombre de surveillants requis" d'un créneau, THE Système SHALL permettre la saisie d'un nombre entier positif
3. WHEN l'administrateur saisit un nombre de surveillants requis, THE Système SHALL valider que la valeur est un entier positif entre 1 et 20
4. WHEN l'administrateur sauvegarde le nombre de surveillants requis, THE Système SHALL enregistrer cette valeur dans la base de données
5. WHEN la sauvegarde échoue, THE Système SHALL afficher un message d'erreur explicite

### Requirement 2

**User Story:** En tant qu'administrateur, je veux voir le taux de remplissage de chaque créneau, afin d'identifier rapidement les créneaux problématiques.

#### Acceptance Criteria

1. WHEN l'administrateur accède à la page d'analyse des disponibilités, THE Système SHALL calculer le taux de remplissage pour chaque créneau ayant une capacité requise définie
2. WHEN un créneau a une capacité requise définie, THE Système SHALL afficher le nombre de surveillants disponibles, la capacité requise et le pourcentage de remplissage
3. WHEN le taux de remplissage est inférieur à 50%, THE Système SHALL afficher le créneau avec un indicateur visuel rouge
4. WHEN le taux de remplissage est entre 50% et 99%, THE Système SHALL afficher le créneau avec un indicateur visuel orange
5. WHEN le taux de remplissage est égal ou supérieur à 100%, THE Système SHALL afficher le créneau avec un indicateur visuel vert

### Requirement 3

**User Story:** En tant qu'administrateur, je veux filtrer et trier les créneaux par taux de remplissage, afin de prioriser les créneaux nécessitant une attention particulière.

#### Acceptance Criteria

1. WHEN l'administrateur accède à la page d'analyse des disponibilités, THE Système SHALL fournir un filtre pour afficher uniquement les créneaux critiques (< 100%)
2. WHEN l'administrateur active le filtre des créneaux critiques, THE Système SHALL masquer tous les créneaux avec un taux de remplissage >= 100%
3. WHEN l'administrateur clique sur l'en-tête de colonne "Taux de remplissage", THE Système SHALL trier les créneaux par ordre croissant ou décroissant
4. WHEN aucune capacité requise n'est définie pour un créneau, THE Système SHALL afficher "Non défini" au lieu d'un pourcentage
5. WHEN l'administrateur exporte les données, THE Système SHALL inclure les informations de capacité et de taux de remplissage

### Requirement 4

**User Story:** En tant qu'administrateur, je veux voir un tableau de bord récapitulatif des créneaux, afin d'avoir une vue d'ensemble rapide de la situation.

#### Acceptance Criteria

1. WHEN l'administrateur accède à la page d'analyse des disponibilités, THE Système SHALL afficher le nombre total de créneaux avec capacité définie
2. WHEN des créneaux ont une capacité définie, THE Système SHALL afficher le nombre de créneaux critiques (< 100%)
3. WHEN des créneaux ont une capacité définie, THE Système SHALL afficher le nombre de créneaux en alerte (50-99%)
4. WHEN des créneaux ont une capacité définie, THE Système SHALL afficher le nombre de créneaux OK (>= 100%)
5. WHEN des créneaux ont une capacité définie, THE Système SHALL calculer et afficher le taux de remplissage moyen global

### Requirement 5

**User Story:** En tant qu'administrateur, je veux modifier en masse la capacité requise de plusieurs créneaux, afin de gagner du temps lors de la configuration initiale.

#### Acceptance Criteria

1. WHEN l'administrateur sélectionne plusieurs créneaux, THE Système SHALL afficher une option "Définir la capacité pour la sélection"
2. WHEN l'administrateur clique sur "Définir la capacité pour la sélection", THE Système SHALL afficher un dialogue de saisie
3. WHEN l'administrateur saisit une capacité et confirme, THE Système SHALL appliquer cette capacité à tous les créneaux sélectionnés
4. WHEN la mise à jour en masse est effectuée, THE Système SHALL afficher un message de confirmation avec le nombre de créneaux modifiés
5. WHEN une erreur survient lors de la mise à jour en masse, THE Système SHALL afficher les créneaux qui n'ont pas pu être mis à jour

### Requirement 6

**User Story:** En tant qu'administrateur, je veux copier la capacité requise d'une session précédente, afin de réutiliser les configurations existantes.

#### Acceptance Criteria

1. WHEN l'administrateur accède à la page de gestion des créneaux, THE Système SHALL fournir une option "Copier depuis une session précédente"
2. WHEN l'administrateur sélectionne une session source, THE Système SHALL afficher les créneaux de cette session avec leur capacité
3. WHEN l'administrateur confirme la copie, THE Système SHALL copier les capacités des créneaux correspondants (même date et heure)
4. WHEN des créneaux ne correspondent pas, THE Système SHALL afficher un rapport des créneaux non copiés
5. WHEN la copie est terminée, THE Système SHALL afficher le nombre de créneaux mis à jour avec succès
