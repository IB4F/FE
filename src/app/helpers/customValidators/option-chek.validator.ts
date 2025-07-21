import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

export function oneCorrectOptionValidator(): ValidatorFn {
  return (formArray: AbstractControl): ValidationErrors | null => {
    const validOptions = (formArray as FormArray).controls.filter(control => control.get('isCorrect')?.value);
    if (validOptions.length === 1) {
      return null;
    }
    return { oneCorrectOption: true };
  };
}
