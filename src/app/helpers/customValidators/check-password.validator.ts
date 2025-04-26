import {AbstractControl} from '@angular/forms';

export function passwordValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const password = control.value;
  const hasNumber = /\d/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
  const isValid = hasNumber && hasUpper && hasSpecial && password.length >= 8;
  return isValid ? null : {invalidPassword: true};
}
