import { Component } from '@angular/core';

/**
 * Leere Zwischenseite: Wer über eine Benachrichtigung auf eine Seite geht, auf der er schon ist, würde sonst
 * den alten Stand sehen – Angular baut eine Seite bei gleicher Adresse nicht neu auf.
 */
@Component({
  selector: 'app-aktualisieren',
  template: '',
})
export class Aktualisieren {}
