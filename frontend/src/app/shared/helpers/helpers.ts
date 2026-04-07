import { FormGroup, FormControl } from '@angular/forms';
import { TableLazyLoadEvent } from 'primeng/table';
import { Observable } from 'rxjs';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface PagingContent<T> {
  data: T[];
  totalElements: number;
}

export interface GridifyQueryExtend {
  Page: number;
  PageSize: number;
  Select: string | null;
  OrderBy: string | null;
  Filter: string | null;
  Includes: string | null;
}

export interface GridifyQueryStaff {
  Page: number;
  PageSize: number;
  Select: string | null;
  OrderBy: string | null;
  Filter: string | null;
  StaffFilter: string | null;
}

export enum FilterOperator {
  'Equals' = '=',
  'NotEquals' = '!=',
  'GreaterThan' = '>',
  'LessThan' = '<',
  'GreaterThanOrEqualTo' = '>=',
  'LessThanOrEqualTo' = '<=',
  'Contains' = '=*',
  'NotContains' = '!*',
  'StartsWith' = '^',
  'NotStartsWith' = '!^',
  'EndsWith' = '$',
  'NotEndsWith' = '!$',
}

export const FilterOperatorSelectOption = [
  { label: 'Equals', value: FilterOperator.Equals },
  { label: 'NotEquals', value: FilterOperator.NotEquals },
  { label: 'GreaterThan', value: FilterOperator.GreaterThan },
  { label: 'LessThan', value: FilterOperator.LessThan },
  { label: 'GreaterThanOrEqualTo', value: FilterOperator.GreaterThanOrEqualTo },
  { label: 'LessThanOrEqualTo', value: FilterOperator.LessThanOrEqualTo },
  { label: 'Contains', value: FilterOperator.Contains },
  { label: 'NotContains', value: FilterOperator.NotContains },
  { label: 'Starts With', value: FilterOperator.StartsWith },
  { label: 'NotStartsWith', value: FilterOperator.NotStartsWith },
  { label: 'EndsWith', value: FilterOperator.EndsWith },
  { label: 'NotEndsWith', value: FilterOperator.NotEndsWith },
];

export const FilterOperatorDateSelectOption = [
  { label: 'Equals', value: FilterOperator.Equals },
  { label: 'NotEquals', value: FilterOperator.NotEquals },
  { label: 'GreaterThan', value: FilterOperator.GreaterThan },
  { label: 'LessThan', value: FilterOperator.LessThan },
  { label: 'GreaterThanOrEqualTo', value: FilterOperator.GreaterThanOrEqualTo },
  { label: 'LessThanOrEqualTo', value: FilterOperator.LessThanOrEqualTo },
];

export const FilterOperatorStatusSelectOption = [
  { label: 'Equals', value: FilterOperator.Equals },
  { label: 'NotEquals', value: FilterOperator.NotEquals },
];

export const FilterOperatorTextSelectOption = [
  { label: 'Contains', value: FilterOperator.Contains },
  { label: 'NotContains', value: FilterOperator.NotContains },
  { label: 'Equals', value: FilterOperator.Equals },
  { label: 'NotEquals', value: FilterOperator.NotEquals },
];

export const FilterOperatorNumberSelectOption = [
  { label: 'Equals', value: FilterOperator.Equals },
  { label: 'NotEquals', value: FilterOperator.NotEquals },
  { label: 'GreaterThan', value: FilterOperator.GreaterThan },
  { label: 'LessThan', value: FilterOperator.LessThan },
  { label: 'GreaterThanOrEqualTo', value: FilterOperator.GreaterThanOrEqualTo },
  { label: 'LessThanOrEqualTo', value: FilterOperator.LessThanOrEqualTo },
];

export const BuildSortText = (event: TableLazyLoadEvent): string => {
  let sortText = '';
  if (event.sortField && event.sortOrder) {
    sortText = `${event.sortField} ${event.sortOrder < 0 ? 'desc' : ''}`;
  }
  return sortText;
};

export const BuildFilterText = (event: TableLazyLoadEvent): string => {
  let filterText = '';
  if (event.filters) {
    for (let [keys, values] of Object.entries(event.filters)) {
      if (
        keys &&
        Array.isArray(values) &&
        'matchMode' in values[0] &&
        'value' in values[0] &&
        values[0].value
      ) {
        if (values[0].value instanceof Date) {
          //Equals
          if (values[0].matchMode === '=') {
            const startDate =
              values[0].value.getFullYear() +
              '-' +
              (values[0].value.getMonth() + 1) +
              '-' +
              values[0].value.getDate() +
              ' 00:00:00.0000000';
            const endDate =
              values[0].value.getFullYear() +
              '-' +
              (values[0].value.getMonth() + 1) +
              '-' +
              values[0].value.getDate() +
              ' 23:59:59.0000000';
            filterText = filterText.concat(
              `(${keys}>=${startDate},${keys}<=${endDate})`,
              ',',
            );
          }
          //NotEquals
          if (values[0].matchMode === '!=') {
            const startDate =
              values[0].value.getFullYear() +
              '-' +
              (values[0].value.getMonth() + 1) +
              '-' +
              values[0].value.getDate() +
              ' 00:00:00.0000000';
            const endDate =
              values[0].value.getFullYear() +
              '-' +
              (values[0].value.getMonth() + 1) +
              '-' +
              values[0].value.getDate() +
              ' 23:59:59.0000000';
            filterText = filterText.concat(
              `(${keys}<${startDate}|${keys}>${endDate})`,
              ',',
            );
          }

          //GreaterThan
          if (values[0].matchMode === '>') {
            const endDate =
              values[0].value.getFullYear() +
              '-' +
              (values[0].value.getMonth() + 1) +
              '-' +
              values[0].value.getDate() +
              ' 23:59:59.0000000';
            filterText = filterText.concat(`(${keys}>${endDate})`, ',');
          }
          //LessThan
          if (values[0].matchMode === '<') {
            const startDate =
              values[0].value.getFullYear() +
              '-' +
              (values[0].value.getMonth() + 1) +
              '-' +
              values[0].value.getDate() +
              ' 00:00:00.0000000';
            filterText = filterText.concat(`(${keys}<${startDate})`, ',');
          }
          //GreaterThanOrEqualTo
          if (values[0].matchMode === '>=') {
            const startDate =
              values[0].value.getFullYear() +
              '-' +
              (values[0].value.getMonth() + 1) +
              '-' +
              values[0].value.getDate() +
              ' 00:00:00.0000000';
            filterText = filterText.concat(`(${keys}>=${startDate})`, ',');
          }
          //LessThanOrEqualTo
          if (values[0].matchMode === '<') {
            const endDate =
              values[0].value.getFullYear() +
              '-' +
              (values[0].value.getMonth() + 1) +
              '-' +
              values[0].value.getDate() +
              ' 23:59:59.0000000';
            filterText = filterText.concat(`(${keys}<=${endDate})`, ',');
          }
        } else {
          //dirty workaround for user not select filter type
          if (values[0].matchMode === 'startsWith') return '';
          filterText = filterText.concat(
            `${keys}${values[0].matchMode}${values[0].value}`,
            '|',
          );
        }
      }
    }
  }
  if (filterText.endsWith('|')) filterText = filterText.slice(0, -1);
  if (filterText.endsWith(',')) filterText = filterText.slice(0, -1);

  //Global Filter
  if (event.globalFilter) {
    if (filterText !== '') filterText = filterText.concat(',');
    filterText = filterText.concat(event.globalFilter as string);
  }
  return filterText;
};

export const ValidateAllFormFields = (formGroup: FormGroup) => {
  Object.keys(formGroup.controls).forEach((field) => {
    const control = formGroup.get(field);
    if (control instanceof FormControl) {
      control.markAsTouched({ onlySelf: true });
    } else if (control instanceof FormGroup) {
      ValidateAllFormFields(control);
    }
  });
};

export const FileToBase64 = (file: File): Observable<string> => {
  return new Observable((obs) => {
    const reader = new FileReader();
    reader.onload = () => {
      obs.next(reader.result as string);
      obs.complete();
    };
    reader.readAsDataURL(file);
  });
};

export const DownloadFile = (
  data: any,
  fileName: string,
): { url: string; download: string } => {
  let downloadURL = window.URL.createObjectURL(data);
  let link = document.createElement('a');
  link.href = downloadURL;

  link.download = fileName;
  // this is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, view: window }),
  );
  //link.click();

  return { url: downloadURL, download: fileName };
};

export interface BaseResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

export interface SelectOption<T> {
  value: T;
  label: string;
}

export function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  return password && confirmPassword && password.value !== confirmPassword.value
    ? { passwordMismatch: true }
    : null;
};
