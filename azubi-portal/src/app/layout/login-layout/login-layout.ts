import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';

/** Rahmen für alle Seiten nach dem Login: Kopfzeile, Seitenleiste und Inhalt. */
@Component({
  selector: 'app-login-layout',
  imports: [HeaderComponent, SidebarComponent, RouterOutlet],
  templateUrl: './login-layout.html',
})
export class LoginLayout {}
