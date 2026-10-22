import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { Auth } from '@app/services/auth';

/** Seiten mit Eingaben, die vor dem Verlassen noch gespeichert werden müssen. */
export interface KannVerlassen {
  /** true = Seite darf verlassen werden (ggf. nach Rückfrage). */
  kannVerlassen(): Promise<boolean> | boolean;
}

/**
 * Fragt beim Verlassen einer Seite (z. B. über die Seitenleiste) nach, wenn noch nicht alles gespeichert ist.
 * Nach Ablauf der Sitzung (Weiterleitung zum Login) wird nicht gefragt – speichern ginge dann ohnehin nicht.
 */
export const unsavedChangesGuard: CanDeactivateFn<KannVerlassen> = (component) => {
  if (!inject(Auth).isLoggedIn()) {
    return true;
  }
  return component.kannVerlassen();
};
