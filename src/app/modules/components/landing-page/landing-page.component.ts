import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Grade {
  name: string;
  desc: string;
  color: string;
  shadow: string;
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements AfterViewInit, OnDestroy {
  readonly grades: Grade[] = [
    { name: 'Klasa e parë',         desc: 'Identifikimi i shkronjave, tingujt dhe rrokjet e para.', color: 'var(--c1)',  shadow: 'rgba(245,166,35,.5)' },
    { name: 'Klasa e dytë',         desc: 'Numrat deri në 100, lexim me kuptim dhe shkrim i parë.', color: 'var(--c2)',  shadow: 'rgba(26,26,26,.4)' },
    { name: 'Klasa e tretë',        desc: 'Tabela e shumëzimit, hartim teksti dhe gjeografia bazë.', color: 'var(--c3)', shadow: 'rgba(26,188,156,.5)' },
    { name: 'Klasa e katërt',       desc: 'Pjesëtimi, pjesët e ligjëratës, qytetaria dhe shkenca.', color: 'var(--c11)', shadow: 'rgba(52,152,219,.5)' },
    { name: 'Klasa e pestë',        desc: 'Thyesa, dhjetorja, historia e popullit dhe natyrës.',    color: 'var(--c5)',  shadow: 'rgba(22,199,154,.5)' },
    { name: 'Klasa e gjashtë',      desc: 'Algjebra e parë, gjeometria dhe biologjia e qelizës.',  color: 'var(--c6)',  shadow: 'rgba(242,92,38,.5)' },
    { name: 'Klasa e shtatë',       desc: 'Ekuacionet lineare, gramatika e thelluar dhe fizika.',  color: 'var(--c7)',  shadow: 'rgba(230,57,70,.5)' },
    { name: 'Klasa e tetë',         desc: 'Sistemet, ese letrare dhe kimia hyrëse.',               color: 'var(--c8)',  shadow: 'rgba(245,166,35,.5)' },
    { name: 'Klasa e nëntë',        desc: 'Provimi i lirimit: matematikë, shqip dhe shkencë.',     color: 'var(--c9)',  shadow: 'rgba(230,57,70,.5)' },
    { name: 'Klasa e dhjetë',       desc: 'Funksione, letërsi botërore dhe biologji e thelluar.',  color: 'var(--c10)', shadow: 'rgba(241,196,15,.5)' },
    { name: 'Klasa e njëmbëdhjetë', desc: 'Trigonometri, fizikë moderne dhe filozofi.',            color: 'var(--c11)', shadow: 'rgba(52,152,219,.5)' },
    { name: 'Klasa e dymbëdhjetë',  desc: 'Matura shtetërore: përgatitje e plotë dhe simulime.',   color: 'var(--c12)', shadow: 'rgba(39,174,96,.5)' },
  ];

  private revealObserver?: IntersectionObserver;
  private countObserver?: IntersectionObserver;
  private rafId = 0;
  private mx = 0; private my = 0;
  private cx = 0; private cy = 0;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      this.initReveal();
      this.initCounters();
      this.initParallax();
      this.initGradeHover();
      this.initMagneticButtons();
    });
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    this.countObserver?.disconnect();
    cancelAnimationFrame(this.rafId);
  }

  onHeroMouseMove(event: MouseEvent, el: HTMLElement): void {
    const r = el.getBoundingClientRect();
    this.mx = ((event.clientX - r.left) / r.width - 0.5) * 2;
    this.my = ((event.clientY - r.top) / r.height - 0.5) * 2;
  }

  onHeroMouseLeave(): void {
    this.mx = 0;
    this.my = 0;
  }

  private root(): HTMLElement {
    return this.host.nativeElement;
  }

  private initReveal(): void {
    const targets = this.root().querySelectorAll('.reveal');
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('in');
            this.revealObserver?.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    targets.forEach((el) => this.revealObserver!.observe(el));
  }

  private initCounters(): void {
    const counters = this.root().querySelectorAll<HTMLElement>('[data-count]');
    this.countObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const target = parseFloat(el.dataset['count'] ?? '0');
          const dur = 1400;
          const t0 = performance.now();
          const start = parseFloat(el.textContent ?? '0') || 0;
          const step = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            const v = Math.round(start + (target - start) * eased);
            el.textContent = v.toLocaleString('it-IT');
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          this.countObserver?.unobserve(el);
        }
      },
      { threshold: 0.4 }
    );
    counters.forEach((c) => this.countObserver!.observe(c));
  }

  private initParallax(): void {
    const floaters = this.root().querySelectorAll<HTMLElement>('.floater');
    const bgs = this.root().querySelectorAll<HTMLElement>('[data-parallax]');
    const loop = () => {
      const sy = window.scrollY;
      this.cx += (this.mx - this.cx) * 0.08;
      this.cy += (this.my - this.cy) * 0.08;
      floaters.forEach((el) => {
        const depth = parseFloat(el.dataset['depth'] ?? '0.2');
        const ty = sy * depth * -0.4;
        const tx = this.cx * depth * 30;
        const tyM = this.cy * depth * 30;
        el.style.transform = `translate3d(${tx}px, ${ty + tyM}px, 0)`;
      });
      bgs.forEach((el) => {
        const d = parseFloat(el.dataset['parallax'] ?? '0.1');
        el.style.transform = `translate3d(0, ${sy * d}px, 0)`;
      });
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private initGradeHover(): void {
    const cards = this.root().querySelectorAll<HTMLElement>('.grade');
    cards.forEach((el) => {
      el.addEventListener('mousemove', (ev) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${((ev.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty('--my', `${((ev.clientY - r.top) / r.height) * 100}%`);
      });
    });
  }

  private initMagneticButtons(): void {
    const buttons = this.root().querySelectorAll<HTMLElement>('.btn-primary, .btn-dark');
    buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.25;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }
}
