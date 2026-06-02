import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PrivacySection {
  id: string;
  label: string;
}

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss'
})
export class PrivacyComponent {
  lastUpdated = '1 Qershor 2025';

  sections: PrivacySection[] = [
    { id: 'kontrollori', label: 'Kontrollori i të Dhënave' },
    { id: 'mbledhja',    label: 'Të Dhënat që Mbledhim' },
    { id: 'perdorimi',   label: 'Si i Përdorim të Dhënat' },
    { id: 'baza',        label: 'Baza Ligjore' },
    { id: 'ndarja',      label: 'Ndarja me Palë të Treta' },
    { id: 'ruajtja',     label: 'Ruajtja dhe Siguria' },
    { id: 'te-drejtat',  label: 'Të Drejtat Tuaja' },
    { id: 'femijte',     label: 'Mbrojtja e Fëmijëve' },
    { id: 'cookies',     label: 'Ruajtja Lokale' },
    { id: 'ndryshimet',  label: 'Ndryshimet e Politikës' },
    { id: 'kontakti',    label: 'Kontakti' },
  ];

  activeSection = 'kontrollori';

  setSection(id: string) {
    this.activeSection = id;
  }

  get activeIndex() {
    return this.sections.findIndex(s => s.id === this.activeSection);
  }

  prev() {
    if (this.activeIndex > 0) {
      this.activeSection = this.sections[this.activeIndex - 1].id;
    }
  }

  next() {
    if (this.activeIndex < this.sections.length - 1) {
      this.activeSection = this.sections[this.activeIndex + 1].id;
    }
  }
}
