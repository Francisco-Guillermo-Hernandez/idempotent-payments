import { Component, OnInit, Signal, ViewChild } from '@angular/core';
import { BillsService } from './bills.service';
import { Bill } from '../utils/types';
import { FormBuilder, FormControl, FormGroup, Validators, FormGroupDirective } from '@angular/forms';
import { zodValidator } from '../utils/validator';
import { z } from 'zod';
import { signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { toast } from 'ngx-sonner';
import { DetailsService } from '../details/details.service';

@Component({
  selector: 'main-card',
  standalone: false,
  templateUrl: './main-card.html',
  styleUrl: './main-card.css',
})
export class MainCard implements OnInit {
  @ViewChild(FormGroupDirective)
  public formGroupDirective!: FormGroupDirective;
  public npeSchema!: z.ZodString;
  public form!: FormGroup;
  public loading = signal<boolean>(false);
  constructor(
    private fb: FormBuilder,
    private billsService: BillsService,
    private detailsService: DetailsService,
  ) {
    this.npeSchema = z.string().min(12, '').max(40, '').regex(/^\d+$/);
  }

  public ngOnInit(): void {
    this.form = this.fb.group({
      npe: ['', [zodValidator(this.npeSchema)]],
    });
  }

  public async send(): Promise<void> {
    if (this.form.valid) {
      this.loading.set(true);

      this.billsService
        .retrieveDetails(this.form.value.npe)
        .pipe(debounceTime(500))
        .subscribe({
          next: data => {
            this.loading.set(false);
            this.detailsService.updateInformation(data[0]);
            // this.form.reset();
            // this.form.clearValidators();
            // this.formGroupDirective.resetForm();
            this.form.get('npe')?.disable();

          },
          error: e => {
            this.loading.set(false);
            toast.error('Ha ocurrido un error al consultar la factura', {
              description: 'Por favor valide los numeros ingresados',
              position: 'top-center',
              duration: 6 * 1000,
            });
          },
        });
    }
  }

  public get bill(): Bill | null {
    return this.detailsService.bill();
  }
}


