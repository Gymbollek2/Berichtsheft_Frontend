import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { BenachrichtigungService } from '@app/services/benachrichtigung.service';
import { Benachrichtigung, BenachrichtigungTyp } from '@app/core/models';
import { zeitRelativ } from '@app/core/utils';

/** Symbol und Farbe je Anlass. */
const DARSTELLUNG: Record<BenachrichtigungTyp, { icon: string; ton: string }> = {
  BERICHT_ABGEGEBEN: { icon: 'fa-file-import', ton: 'navy' },
  BERICHT_ABGEZEICHNET: { icon: 'fa-circle-check', ton: 'ok' },
  BERICHT_ZURUECKGEGEBEN: { icon: 'fa-pen-to-square', ton: 'warn' },
  ERINNERUNG_ABGABE: { icon: 'fa-clock', ton: 'warn' },
  LERNZIEL_ERREICHT: { icon: 'fa-trophy', ton: 'accent' },
  WILLKOMMEN: { icon: 'fa-hand-sparkles', ton: 'accent' },
};

/** Wie lange das Fenster nach dem Verlassen mit der Maus noch offen bleibt (Weg von der Glocke ins Fenster). */
const SCHLIESSEN_MS = 250;

/**
 * Glocke oben rechts mit Anzahl der ungelesenen Benachrichtigungen. Beim Darüberfahren oder Anklicken
 * öffnet sich das Fenster mit den Nachrichten; ein Klick auf eine Nachricht führt zur passenden Seite.
 */
@Component({
  selector: 'app-benachrichtigungen',
  templateUrl: './benachrichtigungen.html',
  styleUrl: './benachrichtigungen.css',
})
export class BenachrichtigungenComponent implements OnInit, OnDestroy {
  protected readonly service = inject(BenachrichtigungService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly offen = signal(false);
  /** Per Klick geöffnet: bleibt offen, bis man außerhalb klickt oder Esc drückt. */
  private readonly angeheftet = signal(false);
  private schliessenTimer: ReturnType<typeof setTimeout> | null = null;

  readonly badge = computed(() => {
    const n = this.service.ungelesen();
    return n > 99 ? '99+' : String(n);
  });
  readonly bezeichnung = computed(() => {
    const n = this.service.ungelesen();
    return n === 0 ? 'Benachrichtigungen' : `Benachrichtigungen, ${n} ungelesen`;
  });

  ngOnInit(): void {
    this.service.starten();
  }

  ngOnDestroy(): void {
    this.service.stoppen();
    this.abbrechenSchliessen();
  }

  darstellung(n: Benachrichtigung): { icon: string; ton: string } {
    return DARSTELLUNG[n.typ] ?? { icon: 'fa-bell', ton: 'navy' };
  }

  zeit(n: Benachrichtigung): string {
    return zeitRelativ(n.erstelltAm);
  }

  // Maus: öffnen beim Darüberfahren, mit kurzer Verzögerung schließen
  mausRein(): void {
    this.abbrechenSchliessen();
    if (!this.offen()) {
      this.oeffnen();
    }
  }

  mausRaus(): void {
    if (this.angeheftet()) {
      return;
    }
    this.abbrechenSchliessen();
    this.schliessenTimer = setTimeout(() => this.schliessen(), SCHLIESSEN_MS);
  }

  /** Klick (auch auf Touch-Geräten ohne Hover): anheften bzw. wieder schließen. */
  umschalten(): void {
    if (this.offen() && this.angeheftet()) {
      this.schliessen();
    } else if (this.offen()) {
      this.angeheftet.set(true);
    } else {
      this.oeffnen(true);
    }
  }

  oeffnen(nachKlick = false): void {
    this.offen.set(true);
    this.angeheftet.set(nachKlick);
    this.service.laden();
  }

  schliessen(): void {
    this.abbrechenSchliessen();
    this.offen.set(false);
    this.angeheftet.set(false);
  }

  oeffneNachricht(n: Benachrichtigung): void {
    this.service.markiereGelesen(n);
    this.schliessen();
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
  }

  @HostListener('document:keydown.escape')
  beiEscape(): void {
    if (this.offen()) {
      this.schliessen();
    }
  }

  @HostListener('document:click', ['$event'])
  beiKlickAussen(event: MouseEvent): void {
    if (this.offen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.schliessen();
    }
  }

  private abbrechenSchliessen(): void {
    if (this.schliessenTimer) {
      clearTimeout(this.schliessenTimer);
      this.schliessenTimer = null;
    }
  }
}
