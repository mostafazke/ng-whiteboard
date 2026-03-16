import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../shared/components/header/header.component';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-documentation',
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.scss'],
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, RouterLink, RouterLinkActive],
})
export class DocumentationComponent {
  navigationItems: NavigationItem[] = [
    { label: 'Getting Started', icon: '🚀', route: '/documentation/getting-started' },
    { label: 'API Reference', icon: '📘', route: '/documentation/api-reference' },
    { label: 'Keyboard Shortcuts', icon: '⌨️', route: '/documentation/keyboard-shortcuts' },
    // { label: 'Arrow Configuration', icon: '➜', route: '/documentation/arrow-configuration' },
  ];
}
