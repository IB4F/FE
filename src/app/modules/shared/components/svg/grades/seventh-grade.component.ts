import {Component} from '@angular/core';

@Component({
  selector: 'app-seventh-svg',
  standalone: true,
  template: `
    <svg width="30" height="30" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M25 50C38.8071 50 50 38.8071 50 25C50 11.1929 38.8071 0 25 0C11.1929 0 0 11.1929 0 25C0 38.8071 11.1929 50 25 50Z"
        fill="#FF3333"/>
      <path
        d="M31.7838 49.068C41.8902 46.2251 49.4028 37.1887 49.9658 26.3135L35.3027 11.6504L17.9952 13.1357L15.9424 17.3145L26.629 28.3715L21.0342 38.3184L31.7838 49.068Z"
        fill="#C60000"/>
      <path d="M35.3027 11.6504L26.9688 38.3184H21.0342L27.5986 17.3145H15.9424V11.6504H35.3027Z"
            fill="#F8FFFB"/>
      <path d="M35.3027 11.6504L26.9688 38.3184H25V25.6289L27.5986 17.3145H25V11.6504H35.3027Z"
            fill="#D8D8D8"/>
    </svg>
  `
})
export class SeventhSvgComponent {
}
