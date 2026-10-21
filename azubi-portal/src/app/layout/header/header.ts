import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Auth } from '@app/services/auth';
import { NavigationService } from '@app/services/navigation';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
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
    this.auth.logout();
  }
}
