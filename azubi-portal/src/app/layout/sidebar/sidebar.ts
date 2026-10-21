import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Auth } from '@app/services/auth';
import { NavigationService } from '@app/services/navigation';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly navigation = inject(NavigationService);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly links = computed(() => {
    const sections = this.navigation.sectionsFor(this.auth.role());
    return this.navigation.sectionForUrl(this.url(), sections)?.links ?? [];
  });
}
