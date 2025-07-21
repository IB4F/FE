import {Component} from '@angular/core';

@Component({
  selector: 'app-eleventh-svg',
  standalone: true,
  template: `
    <svg width="30" height="30" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-blue" x1="0" y1="0" x2="50" y2="50">
          <stop stop-color="#A5D8FF"/>
          <stop offset="1" stop-color="#2563EB"/>
        </linearGradient>
        <filter id="text-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="1.5" stdDeviation="1" flood-color="black" flood-opacity="0.4"/>
        </filter>
      </defs>

      <circle cx="25" cy="25" r="22" fill="url(#grad-blue)" stroke="#3B82F6" stroke-width="2"/>
      <circle cx="25" cy="25" r="16" fill="white" opacity="0.1"/>
      <path d="M10 10 C18 2, 32 2, 40 10" stroke="white" stroke-width="2" stroke-linecap="round" opacity="0.2"/>

      <text x="25" y="28" text-anchor="middle" dominant-baseline="middle"
            font-family="Arial, sans-serif" font-weight="bold" font-size="20" fill="white"
            filter="url(#text-shadow)">11
      </text>
    </svg>
  `
})
export class EleventhComponent {}
