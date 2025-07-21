import { Component } from '@angular/core';

@Component({
  selector: 'app-tenth-svg',
  standalone: true,
  template: `
    <svg width="30" height="30" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-orange" x1="0" y1="0" x2="50" y2="50">
          <stop stop-color="#FFD97A"/>
          <stop offset="1" stop-color="#FF8A00"/>
        </linearGradient>
        <filter id="text-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0.8" dy="1.2" stdDeviation="0.8" flood-color="black" flood-opacity="0.4"/>
        </filter>
      </defs>

      <!-- Outer circle -->
      <circle cx="25" cy="25" r="23" fill="url(#grad-orange)" stroke="#F9880D" stroke-width="2"/>
      <!-- Inner gloss circle -->
      <circle cx="25" cy="25" r="18" fill="white" opacity="0.1"/>
      <!-- Glossy arc -->
      <path d="M10 10 C18 3, 32 3, 40 10" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.2"/>

      <!-- Centered number -->
      <text x="25" y="27" text-anchor="middle" dominant-baseline="middle"
            font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="white"
            filter="url(#text-shadow)">10</text>
    </svg>
  `
})
export class TenthComponent { }
