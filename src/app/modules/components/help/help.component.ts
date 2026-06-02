import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss'
})
export class HelpComponent {
  activeRole: 'student' | 'supervisor' | 'family' = 'student';

  roles = [
    { key: 'student' as const, label: 'Nxënës', icon: '🎓' },
    { key: 'supervisor' as const, label: 'Supervisor', icon: '👩‍🏫' },
    { key: 'family' as const, label: 'Familje', icon: '👨‍👩‍👧' },
  ];

  studentSteps = [
    {
      num: 1, title: 'Krijo llogarinë',
      desc: 'Shko te faqja e regjistrimit, plotëso emrin, email-in dhe fjalëkalimin tënd. Zgjidhni rolin "Nxënës" dhe konfirmo.',
    },
    {
      num: 2, title: 'Verifiko email-in',
      desc: 'Do të marrësh një email me link verifikimi. Kliko atë link për të aktivizuar llogarinë dhe për t\'hyrë në platformë.',
    },
    {
      num: 3, title: 'Zgjidhni abonimin',
      desc: 'Eksploro paketat e disponueshme dhe zgjidhni atë që i përshtatet nevojave tuaja. Pagesa realizohet online me kartë ose transfertë bankare.',
    },
    {
      num: 4, title: 'Hyni te kurset',
      desc: 'Pasi konfirmohet abonimi, keni qasje te të gjitha kurset e klasës suaj. Materiali organizohet sipas lëndës dhe nivelit.',
    },
    {
      num: 5, title: 'Zgjidhni quizet',
      desc: 'Çdo kurs ka quiz-e interaktivë të ndërtuar me sistem ripërsëritjeje të hapësirave (spaced repetition) për memorizim optimal.',
    },
    {
      num: 6, title: 'Monitoroni progresin',
      desc: 'Nga dashboard-i juaj mund të shihni konceptet e mësuara, quiz-et e përfunduara dhe performancën në kohë reale.',
    },
  ];

  supervisorSteps = [
    {
      num: 1, title: 'Aplikoni si Supervisor',
      desc: 'Nga faqja kryesore, zgjidhni "Apliko si Supervisor". Plotësoni formularin me të dhënat profesionale dhe dërgoni kërkesën.',
    },
    {
      num: 2, title: 'Prisni miratimin',
      desc: 'Ekipi ynë shqyrton çdo aplikim. Pasi miratohet, do të merrni konfirmim me email dhe qasje te dashboard-i i supervisorit.',
    },
    {
      num: 3, title: 'Shtoni nxënës',
      desc: 'Nga seksioni "Studentët", shtoni nxënësit tuaj duke vendosur email-in e tyre ose duke dërguar ftesë direkte.',
    },
    {
      num: 4, title: 'Monitoroni progresin',
      desc: 'Shihni progresin e detajuar të secilit nxënës: konceptet e mësuara, quiz-et e bëra, frekuencën dhe notat.',
    },
    {
      num: 5, title: 'Menaxhoni fjalëkalimet',
      desc: 'Në rast nevoje, mund të inicioni reset të fjalëkalimit për çdo nxënës të listës suaj drejtpërsëdrejti nga paneli.',
    },
  ];

  familySteps = [
    {
      num: 1, title: 'Regjistrohuni si Familje',
      desc: 'Shkoni te regjistrimi dhe zgjidhni rolin "Familje". Plotësoni të dhënat e kontaktit dhe krijoni llogarinë e familjes.',
    },
    {
      num: 2, title: 'Zgjidhni paketën',
      desc: 'Paketat familjare mbulojnë disa fëmijë me çmim të vetëm. Zgjidhni planin e përshtatshëm dhe realizoni pagesën.',
    },
    {
      num: 3, title: 'Shtoni fëmijët',
      desc: 'Nga paneli i familjes, klikoni "Shto Fëmijë" dhe vendosni emrin e fëmijës, klasën dhe të dhënat e llogarisë.',
    },
    {
      num: 4, title: 'Monitoroni aktivitetin',
      desc: 'Shihni në kohë reale sesi secili fëmijë po përparon: lëndët aktive, quiz-et, konceptet dhe kohën e shpenzuar.',
    },
  ];

  faqs = [
    {
      q: 'A mund ta provoj platformën falas?',
      a: 'Aktualisht ofrojmë një periudhë prove të kufizuar për nxënës të rinj. Na kontaktoni për të mësuar më shumë rreth ofertave aktuale.',
    },
    {
      q: 'Cilat klasa janë aktive tani?',
      a: 'Klasa e parë është plotësisht aktive me të gjitha materialet dhe quiz-et. Klasat e tjera janë në zhvillim dhe do aktivizohen gradualisht.',
    },
    {
      q: 'Si funksionon sistemi i ripërsëritjes (Spaced Repetition)?',
      a: 'Algoritmi ynë gjurmon çdo koncept të mësuar dhe planifikon rishikime automatike në intervalin optimal — kjo ndihmon memorizimin afatgjatë pa mësiminluar të tepërt.',
    },
    {
      q: 'Si mund të ndryshoj fjalëkalimin tim?',
      a: 'Nga faqja e hyrjes, klikoni "Harrova fjalëkalimin" dhe ndiqni udhëzimet. Supervisorët gjithashtu mund të resetojnë fjalëkalimet e nxënësve të tyre.',
    },
    {
      q: 'A funksionon platforma në celular?',
      a: 'Po, platforma është plotësisht e adaptueshme (responsive) dhe funksionon mirë në celularë, tabletë dhe kompjuterë.',
    },
    {
      q: 'Si mund të anuloj abonimin?',
      a: 'Mund të menaxhoni abonimin nga seksioni "Cilësimet". Për ndihmë të mëtejshme, na kontaktoni në info@braingainalbania.al.',
    },
  ];

  openFaq: number | null = null;

  toggleFaq(i: number) {
    this.openFaq = this.openFaq === i ? null : i;
  }

  get currentSteps() {
    if (this.activeRole === 'student') return this.studentSteps;
    if (this.activeRole === 'supervisor') return this.supervisorSteps;
    return this.familySteps;
  }
}
