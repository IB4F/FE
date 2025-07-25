import {Component} from '@angular/core';

@Component({
  selector: 'app-first-svg',
  standalone: true,
  template: `
    <svg width="30" height="30" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M25 50C38.8071 50 50 38.8071 50 25C50 11.1929 38.8071 0 25 0C11.1929 0 0 11.1929 0 25C0 38.8071 11.1929 50 25 50Z"
        fill="#FFB54A"/>
      <path
        d="M33.3166 48.5813C40.9643 45.8841 46.9061 39.5732 49.0909 31.6984L28.7489 11.3564C28.7489 11.3564 20.0857 18.6124 20.4413 20.6035L24.4157 24.53L23.0849 38.3496L33.3166 48.5813Z"
        fill="#F9880D"/>
      <path
        d="M28.749 11.3564V38.3496H23.085V18.3242L20.4414 20.6035L16.7432 16.3135L22.1514 11.6504L22.4922 11.3564H28.749Z"
        fill="#F8FFFB"/>
      <path d="M25 11.3564H28.749V38.3496H25V11.3564Z" fill="#D8D8D8"/>
    </svg>
  `
})
export class FirstSvgComponent {
}
