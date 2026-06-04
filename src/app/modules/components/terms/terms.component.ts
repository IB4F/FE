import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface TermsSection {
  id: string;
  label: string;
}

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss'
})
export class TermsComponent {
  lastUpdated = '1 Qershor 2025';

  sections: TermsSection[] = [
    { id: 'pranimi',      label: 'Pranimi i Kushteve' },
    { id: 'sherbimi',     label: 'Përshkrimi i Shërbimit' },
    { id: 'llogarite',    label: 'Llogaritë dhe Regjistrimi' },
    { id: 'abonimi',      label: 'Abonimi dhe Pagesa' },
    { id: 'perdorimi',    label: 'Përdorimi i Pranueshëm' },
    { id: 'pronesia',     label: 'Pronësia Intelektuale' },
    { id: 'privatesia',   label: 'Privatësia' },
    { id: 'perjashtimi',  label: 'Kufizimi i Përgjegjësisë' },
    { id: 'nderprerja',   label: 'Ndërprerja e Shërbimit' },
    { id: 'ndryshimet',   label: 'Ndryshimet e Kushteve' },
    { id: 'ligji',        label: 'Ligji i Zbatueshëm' },
    { id: 'kontakti',     label: 'Kontakti' },
  ];

  activeSection = 'pranimi';

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
