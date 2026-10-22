import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Auth } from '@app/services/auth';
import { NavigationService } from '@app/services/navigation';

/** Seitenleiste mit allen Bereichen der Rolle, dem angemeldeten Benutzer und Abmelden. */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly navigation = inject(NavigationService);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly sections = computed(() => this.navigation.sectionsFor(this.auth.role()));
  protected readonly activeKey = computed(
    () => this.navigation.sectionForUrl(this.url(), this.sections())?.key ?? null,
  );

  logout(): void {
    this.auth.logout(true, true);
  }
}
