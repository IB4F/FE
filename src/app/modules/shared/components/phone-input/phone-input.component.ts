import { Component, Input, forwardRef, OnInit, ViewChild, ElementRef, Optional, Self } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, NgControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

interface PhoneNumber {
  countryCode: string;
  number: string;
  e164Number: string;
}

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatSelectModule, MatOptionModule],
  template: `
    <div class="phone-input-container" [class.phone-input-focused]="focused" [class.phone-input-disabled]="disabled">
      <mat-select
        class="country-select"
        [value]="selectedCountry"
        (selectionChange)="onCountryChange($event.value)"
        [disabled]="disabled"
        panelClass="phone-country-panel">
        <mat-option value="al">
          <span class="flag-icon">🇦🇱</span>
          <span class="country-code">+355</span>
        </mat-option>
        <mat-option value="it">
          <span class="flag-icon">🇮🇹</span>
          <span class="country-code">+39</span>
        </mat-option>
        <mat-option value="de">
          <span class="flag-icon">🇩🇪</span>
          <span class="country-code">+49</span>
        </mat-option>
        <mat-option value="fr">
          <span class="flag-icon">🇫🇷</span>
          <span class="country-code">+33</span>
        </mat-option>
        <mat-option value="uk">
          <span class="flag-icon">🇬🇧</span>
          <span class="country-code">+44</span>
        </mat-option>
      </mat-select>

      <input
        #phoneInput
        class="phone-number-input"
        type="tel"
        [placeholder]="placeholder || 'Nr. Telefonit'"
        [value]="phoneNumber"
        (input)="onPhoneNumberChange($event)"
        (focus)="onFocusIn($event)"
        (blur)="onFocusOut($event)"
        [disabled]="disabled"
        [attr.aria-describedby]="describedBy"
        [id]="id"
        autocomplete="tel">
    </div>
  `,
  styleUrls: ['./phone-input.component.scss'],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: PhoneInputComponent,
    },
  ],
  host: {
    '[class.phone-input-floating]': 'shouldLabelFloat',
    '[id]': 'id',
  },
})
export class PhoneInputComponent implements ControlValueAccessor, MatFormFieldControl<PhoneNumber>, OnInit {
  static nextId = 0;

  @ViewChild('phoneInput') phoneInputRef!: ElementRef<HTMLInputElement>;

  // MatFormFieldControl implementation
  stateChanges = new Subject<void>();
  id = `phone-input-${PhoneInputComponent.nextId++}`;
  describedBy = '';
  focused = false;
  controlType = 'phone-input';

  private _placeholder = '';
  private _required = false;
  private _disabled = false;
  private _value: PhoneNumber | null = null;

  // Country codes mapping
  private countryCodeMap: { [key: string]: string } = {
    'al': '+355',
    'it': '+39',
    'de': '+49',
    'fr': '+33',
    'uk': '+44'
  };

  selectedCountry = 'al'; // Default to Albania
  phoneNumber = '';

  // ControlValueAccessor
  private onChange = (value: PhoneNumber | null) => {};
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
    // Set default value for Albania
    this.updateValue();
  }

  ngOnDestroy() {
    this.stateChanges.complete();
    this.focusMonitor.stopMonitoring(this.elementRef);
  }

  // MatFormFieldControl implementation
  @Input()
  get placeholder(): string {
    return this._placeholder;
  }
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  get value(): PhoneNumber | null {
    return this._value;
  }
  set value(phoneNumber: PhoneNumber | null) {
    this._value = phoneNumber;
    if (phoneNumber) {
      // Extract country and number from e164Number if available
      if (phoneNumber.e164Number) {
        for (const [country, code] of Object.entries(this.countryCodeMap)) {
          if (phoneNumber.e164Number.startsWith(code)) {
            this.selectedCountry = country;
            this.phoneNumber = phoneNumber.e164Number.substring(code.length);
            break;
          }
        }
      } else {
        this.phoneNumber = phoneNumber.number || '';
        this.selectedCountry = phoneNumber.countryCode || 'al';
      }
    } else {
      this.phoneNumber = '';
      this.selectedCountry = 'al';
    }
    this.stateChanges.next();
  }

  get empty(): boolean {
    return !this.phoneNumber || this.phoneNumber.trim() === '';
  }

  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  get errorState(): boolean {
    return !!(this.ngControl && this.ngControl.invalid && (this.ngControl.dirty || this.ngControl.touched));
  }

  setDescribedByIds(ids: string[]): void {
    this.describedBy = ids.join(' ');
  }

  onContainerClick(): void {
    if (this.phoneInputRef) {
      this.phoneInputRef.nativeElement.focus();
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: PhoneNumber | null): void {
    this.value = value;
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

  // Event handlers
  onCountryChange(country: string): void {
    this.selectedCountry = country;
    this.updateValue();
  }

  onPhoneNumberChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.phoneNumber = target.value;
    this.updateValue();
  }

  onFocusIn(event: FocusEvent): void {
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

  private updateValue(): void {
    const countryCode = this.countryCodeMap[this.selectedCountry];
    const cleanNumber = this.phoneNumber.replace(/\D/g, '');

    if (cleanNumber) {
      const phoneValue: PhoneNumber = {
        countryCode: this.selectedCountry,
        number: cleanNumber,
        e164Number: `${countryCode}${cleanNumber}`
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
