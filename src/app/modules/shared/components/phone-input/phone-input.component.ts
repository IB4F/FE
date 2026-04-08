import { Component, Input, OnInit, OnDestroy, ElementRef, Optional, Self } from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';

interface Country {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface PhoneNumber {
  countryCode: string;
  number: string;
  e164Number: string;
}

const COUNTRIES: Country[] = [
  { iso2: 'al', name: 'Shqipëri', dialCode: '+355', flag: '🇦🇱' },
  { iso2: 'xk', name: 'Kosovë', dialCode: '+383', flag: '🇽🇰' },
  { iso2: 'mk', name: 'Maqedoni e Veriut', dialCode: '+389', flag: '🇲🇰' },
  { iso2: 'me', name: 'Mali i Zi', dialCode: '+382', flag: '🇲🇪' },
  { iso2: 'rs', name: 'Serbi', dialCode: '+381', flag: '🇷🇸' },
  { iso2: 'it', name: 'Itali', dialCode: '+39', flag: '🇮🇹' },
  { iso2: 'de', name: 'Gjermani', dialCode: '+49', flag: '🇩🇪' },
  { iso2: 'fr', name: 'Francë', dialCode: '+33', flag: '🇫🇷' },
  { iso2: 'gb', name: 'Mbretëria e Bashkuar', dialCode: '+44', flag: '🇬🇧' },
  { iso2: 'us', name: 'Shtetet e Bashkuara', dialCode: '+1', flag: '🇺🇸' },
  { iso2: 'at', name: 'Austri', dialCode: '+43', flag: '🇦🇹' },
  { iso2: 'be', name: 'Belgjikë', dialCode: '+32', flag: '🇧🇪' },
  { iso2: 'bg', name: 'Bullgari', dialCode: '+359', flag: '🇧🇬' },
  { iso2: 'hr', name: 'Kroaci', dialCode: '+385', flag: '🇭🇷' },
  { iso2: 'cy', name: 'Qipro', dialCode: '+357', flag: '🇨🇾' },
  { iso2: 'cz', name: 'Çeki', dialCode: '+420', flag: '🇨🇿' },
  { iso2: 'dk', name: 'Danimarkë', dialCode: '+45', flag: '🇩🇰' },
  { iso2: 'ee', name: 'Estoni', dialCode: '+372', flag: '🇪🇪' },
  { iso2: 'fi', name: 'Finlandë', dialCode: '+358', flag: '🇫🇮' },
  { iso2: 'gr', name: 'Greqi', dialCode: '+30', flag: '🇬🇷' },
  { iso2: 'hu', name: 'Hungari', dialCode: '+36', flag: '🇭🇺' },
  { iso2: 'ie', name: 'Irlandë', dialCode: '+353', flag: '🇮🇪' },
  { iso2: 'lv', name: 'Letoni', dialCode: '+371', flag: '🇱🇻' },
  { iso2: 'lt', name: 'Lituani', dialCode: '+370', flag: '🇱🇹' },
  { iso2: 'lu', name: 'Luksemburg', dialCode: '+352', flag: '🇱🇺' },
  { iso2: 'mt', name: 'Maltë', dialCode: '+356', flag: '🇲🇹' },
  { iso2: 'nl', name: 'Holandë', dialCode: '+31', flag: '🇳🇱' },
  { iso2: 'no', name: 'Norvegji', dialCode: '+47', flag: '🇳🇴' },
  { iso2: 'pl', name: 'Poloni', dialCode: '+48', flag: '🇵🇱' },
  { iso2: 'pt', name: 'Portugali', dialCode: '+351', flag: '🇵🇹' },
  { iso2: 'ro', name: 'Rumani', dialCode: '+40', flag: '🇷🇴' },
  { iso2: 'sk', name: 'Sllovaki', dialCode: '+421', flag: '🇸🇰' },
  { iso2: 'si', name: 'Slloveni', dialCode: '+386', flag: '🇸🇮' },
  { iso2: 'es', name: 'Spanjë', dialCode: '+34', flag: '🇪🇸' },
  { iso2: 'se', name: 'Suedi', dialCode: '+46', flag: '🇸🇪' },
  { iso2: 'ch', name: 'Zvicër', dialCode: '+41', flag: '🇨🇭' },
  { iso2: 'tr', name: 'Turqi', dialCode: '+90', flag: '🇹🇷' },
  { iso2: 'ca', name: 'Kanada', dialCode: '+1', flag: '🇨🇦' },
  { iso2: 'au', name: 'Australi', dialCode: '+61', flag: '🇦🇺' },
];

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSelectModule, MatOptionModule, MatInputModule],
  template: `
    <div class="phone-input-container" [class.phone-input-focused]="focused" [class.phone-input-disabled]="disabled">
      <mat-select
        class="country-select"
        [value]="selectedCountry"
        (selectionChange)="onCountryChange($event.value)"
        [disabled]="disabled"
        panelClass="phone-country-panel"
        (openedChange)="onSelectOpenedChange($event)">
        <mat-select-trigger>
          <span class="flag-icon">{{ getCountry(selectedCountry)?.flag }}</span>
          <span class="dial-code">{{ getCountry(selectedCountry)?.dialCode }}</span>
        </mat-select-trigger>
        <div class="country-search-wrapper" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
          <input
            #searchInput
            class="country-search-input"
            type="text"
            placeholder="Kërko shtetin..."
            [formControl]="searchControl"
            autocomplete="off">
        </div>
        <mat-option *ngFor="let country of filteredCountries" [value]="country.iso2">
          <span class="flag-icon">{{ country.flag }}</span>
          <span class="country-name">{{ country.name }}</span>
          <span class="dial-code-option">{{ country.dialCode }}</span>
        </mat-option>
      </mat-select>

      <input
        #phoneInput
        class="phone-number-input"
        type="tel"
        [placeholder]="placeholder || 'Nr. Telefonit'"
        [value]="phoneNumber"
        (input)="onPhoneNumberChange($event)"
        (focus)="onFocusIn()"
        (blur)="onFocusOut($event)"
        [disabled]="disabled"
        [attr.aria-describedby]="describedBy"
        [id]="id"
        autocomplete="tel">
    </div>
  `,
  styleUrls: ['./phone-input.component.scss'],
  providers: [
    { provide: MatFormFieldControl, useExisting: PhoneInputComponent }
  ],
  host: {
    '[class.phone-input-floating]': 'shouldLabelFloat',
    '[id]': 'id',
  },
})
export class PhoneInputComponent implements ControlValueAccessor, MatFormFieldControl<PhoneNumber>, OnInit, OnDestroy {
  static nextId = 0;

  stateChanges = new Subject<void>();
  id = `phone-input-${PhoneInputComponent.nextId++}`;
  describedBy = '';
  focused = false;
  controlType = 'phone-input';

  private _placeholder = '';
  private _required = false;
  private _disabled = false;
  private _value: PhoneNumber | null = null;

  selectedCountry = 'al';
  phoneNumber = '';
  searchControl = new FormControl('');
  filteredCountries: Country[] = [...COUNTRIES];

  private onChange = (_: PhoneNumber | null) => {};
  private onTouched = () => {};

  constructor(
    private focusMonitor: FocusMonitor,
    private elementRef: ElementRef<HTMLElement>,
    @Optional() @Self() public ngControl: NgControl
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    this.focusMonitor.monitor(elementRef, true).subscribe(origin => {
      if (this.focused && !origin) {
        this.onTouched();
      }
      this.focused = !!origin;
      this.stateChanges.next();
    });
  }

  ngOnInit() {
    this.searchControl.valueChanges.subscribe(query => {
      const q = (query || '').toLowerCase();
      this.filteredCountries = COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso2.includes(q)
      );
    });
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this.focusMonitor.stopMonitoring(this.elementRef);
  }

  @Input()
  get placeholder(): string { return this._placeholder; }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  @Input()
  get required(): boolean { return this._required; }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  @Input()
  get disabled(): boolean { return this._disabled; }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  get value(): PhoneNumber | null { return this._value; }

  get empty(): boolean { return !this.phoneNumber || this.phoneNumber.trim() === ''; }

  get shouldLabelFloat(): boolean { return this.focused || !this.empty; }

  get errorState(): boolean {
    return !!(this.ngControl?.invalid && (this.ngControl.dirty || this.ngControl.touched));
  }

  setDescribedByIds(ids: string[]): void {
    this.describedBy = ids.join(' ');
  }

  onContainerClick(): void {
    this.elementRef.nativeElement.querySelector<HTMLInputElement>('.phone-number-input')?.focus();
  }

  writeValue(value: PhoneNumber | null): void {
    this._value = value;
    if (value?.e164Number) {
      const country = COUNTRIES.find(c => value.e164Number.startsWith(c.dialCode));
      if (country) {
        this.selectedCountry = country.iso2;
        this.phoneNumber = value.e164Number.substring(country.dialCode.length);
      }
    } else if (value?.number) {
      this.phoneNumber = value.number;
      this.selectedCountry = value.countryCode || 'al';
    } else {
      this.phoneNumber = '';
      this.selectedCountry = 'al';
    }
    this.stateChanges.next();
  }

  registerOnChange(fn: (value: PhoneNumber | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onCountryChange(iso2: string): void {
    this.selectedCountry = iso2;
    this.updateValue();
  }

  onPhoneNumberChange(event: Event): void {
    this.phoneNumber = (event.target as HTMLInputElement).value;
    this.updateValue();
  }

  onFocusIn(): void {
    if (!this.focused) {
      this.focused = true;
      this.stateChanges.next();
    }
  }

  onFocusOut(event: FocusEvent): void {
    if (!this.elementRef.nativeElement.contains(event.relatedTarget as Node)) {
      this.focused = false;
      this.onTouched();
      this.stateChanges.next();
    }
  }

  onSelectOpenedChange(opened: boolean): void {
    if (!opened) {
      this.searchControl.setValue('');
    }
  }

  getCountry(iso2: string): Country | undefined {
    return COUNTRIES.find(c => c.iso2 === iso2);
  }

  private updateValue(): void {
    const country = this.getCountry(this.selectedCountry);
    const cleanNumber = this.phoneNumber.replace(/\D/g, '');
    if (cleanNumber && country) {
      const phoneValue: PhoneNumber = {
        countryCode: this.selectedCountry,
        number: cleanNumber,
        e164Number: `${country.dialCode}${cleanNumber}`
      };
      this._value = phoneValue;
      this.onChange(phoneValue);
    } else {
      this._value = null;
      this.onChange(null);
    }
    this.stateChanges.next();
  }
}