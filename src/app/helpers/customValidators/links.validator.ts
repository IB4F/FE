import { AbstractControl, ValidatorFn, FormArray } from '@angular/forms';

export function requiredRowsValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const formArray = control as FormArray;
    return formArray.length === 0 ? { 'requiredRows': true } : null;
  };
}
