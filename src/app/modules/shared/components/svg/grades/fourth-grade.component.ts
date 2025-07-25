import {Component} from '@angular/core';

@Component({
  selector: 'app-fourth-svg',
  standalone: true,
  template: `
    <svg width="30" height="30" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M25 50C38.8071 50 50 38.8071 50 25C50 11.1929 38.8071 0 25 0C11.1929 0 0 11.1929 0 25C0 38.8071 11.1929 50 25 50Z"
        fill="#424242"/>
      <path
        d="M49.6912 28.9324L32.4092 11.6504L14.9854 31.6436L32.2675 48.9257C41.3124 46.1817 48.1872 38.4507 49.6912 28.9324Z"
        fill="#232323"/>
      <path
        d="M32.4092 25.9795V11.6504H25.0537L14.9854 26.0947V31.6436H26.7451V38.3496H32.4092V31.6436H36.0293V25.9795H32.4092ZM26.7451 25.9795H21.9697L26.7451 19.1299V25.9795Z"
        fill="#F8FFFB"/>
      <path
        d="M32.4092 25.9795V11.6504H25.0537L25 11.7275V21.6328L26.7451 19.1299V25.9795H25V31.6436H26.7451V38.3496H32.4092V31.6436H36.0293V25.9795H32.4092Z"
        fill="#D8D8D8"/>
    </svg>
  `
})
export class FourthSvgComponent {
}
