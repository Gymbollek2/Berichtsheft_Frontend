import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar';
import { BenachrichtigungenComponent } from '../benachrichtigungen/benachrichtigungen';

/** Rahmen für alle Seiten nach dem Login: Seitenleiste (mobil ausklappbar), Glocke oben rechts und Inhalt. */
@Component({
  selector: 'app-login-layout',
  imports: [SidebarComponent, RouterOutlet, BenachrichtigungenComponent],
  templateUrl: './login-layout.html',
  styleUrl: './login-layout.css',
})
export class LoginLayout {
  readonly menuOpen = signal(false);

  constructor() {
    // Nach jedem Seitenwechsel das mobile Menü schließen
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.menuOpen.set(false));
  }
}
