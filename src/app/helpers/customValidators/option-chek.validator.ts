import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

export function atLeastOneCorrectOptionValidator(): ValidatorFn {
  return (formArray: AbstractControl): ValidationErrors | null => {
    const validOptions = (formArray as FormArray).controls.filter(control => control.get('isCorrect')?.value);
    if (validOptions.length >= 1 && validOptions.length <= 4) {
      return null;
    }
    return { atLeastOneCorrectOption: true };
  };
}

// Manteniamo il vecchio nome per compatibilità, ma deprecato
export function oneCorrectOptionValidator(): ValidatorFn {
  return atLeastOneCorrectOptionValidator();
}
